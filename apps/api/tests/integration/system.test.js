const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { User, SystemConfig } = require('../../src/models');
const { systemConfigService, emailService } = require('../../src/services');
const { userOne, admin, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');

setupTestDB();

describe('System routes', () => {
  beforeEach(() => {
    systemConfigService.invalidateCache();
    jest.restoreAllMocks();
  });

  describe('GET /v1/system/status', () => {
    test('should return isInitialized false and setupRequired true on clean database', async () => {
      const res = await request(app).get('/v1/system/status').send().expect(httpStatus.OK);

      expect(res.body).toEqual({
        isInitialized: false,
        setupRequired: true,
        maintenanceMode: false,
      });
    });

    test('should return isInitialized true and setupRequired false after setup has completed', async () => {
      await insertUsers([admin]);
      await SystemConfig.create({
        _id: 'global',
        isInitialized: true,
        initializedAt: new Date(),
        initializedBy: admin._id,
      });

      const res = await request(app).get('/v1/system/status').send().expect(httpStatus.OK);

      expect(res.body).toEqual({
        isInitialized: true,
        setupRequired: false,
        maintenanceMode: false,
      });
    });
  });

  describe('GET /v1/system/app-updates', () => {
    test('should return android and ios version metadata', async () => {
      const res = await request(app).get('/v1/system/app-updates').send().expect(httpStatus.OK);

      expect(res.body).toHaveProperty('android');
      expect(res.body).toHaveProperty('ios');
      expect(res.body.android).toMatchObject({
        minVersion: '1.0.0',
        latestVersion: '1.0.0',
        forceUpdate: false,
      });
      expect(res.body.ios).toMatchObject({
        minVersion: '1.0.0',
        latestVersion: '1.0.0',
        forceUpdate: false,
      });
    });
  });

  describe('POST /v1/system/setup', () => {
    let setupPayload;

    beforeEach(() => {
      setupPayload = {
        admin: {
          fullName: 'Root Super Admin',
          email: 'root@projectshub.com',
          password: 'Password123!',
        },
        clientUrl: 'https://hub.university.edu',
        supportEmail: 'support@university.edu',
        maintenanceMode: false,
        uploadDirectory: 'custom-uploads',
        maxFileSizeInMb: {
          monograph: 30,
          screenshot: 10,
        },
        emailSender: {
          fromName: 'University Hub',
          fromAddress: 'notifications@university.edu',
        },
        appUpdates: {
          android: {
            minVersion: '1.1.0',
            latestVersion: '1.2.0',
            forceUpdate: false,
            updateUrl: 'https://play.google.com/store/apps/details?id=com.projectshub.app',
            releaseNotes: 'Initial release',
          },
        },
      };
    });

    test('should successfully bootstrap system on first run and return 201 with auth tokens and config', async () => {
      const res = await request(app).post('/v1/system/setup').send(setupPayload).expect(httpStatus.CREATED);

      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('tokens');
      expect(res.body).toHaveProperty('config');

      // Verify user
      expect(res.body.user).toMatchObject({
        fullName: setupPayload.admin.fullName,
        email: setupPayload.admin.email,
        role: 'super_admin',
        isEmailVerified: true,
      });
      expect(res.body.user).not.toHaveProperty('password');

      // Verify tokens
      expect(res.body.tokens).toHaveProperty('access');
      expect(res.body.tokens).toHaveProperty('refresh');

      // Verify config
      expect(res.body.config).toMatchObject({
        isInitialized: true,
        clientUrl: setupPayload.clientUrl,
        supportEmail: setupPayload.supportEmail,
        uploadDirectory: setupPayload.uploadDirectory,
        maxFileSizeInMb: setupPayload.maxFileSizeInMb,
        emailSender: setupPayload.emailSender,
      });

      // Verify DB persistence
      const dbUser = await User.findOne({ email: setupPayload.admin.email });
      expect(dbUser).toBeDefined();
      expect(dbUser.role).toBe('super_admin');

      const dbConfig = await SystemConfig.findById('global');
      expect(dbConfig.isInitialized).toBe(true);
      expect(dbConfig.clientUrl).toBe(setupPayload.clientUrl);
    });

    test('should return 403 Forbidden if system is already initialized', async () => {
      // First setup
      await request(app).post('/v1/system/setup').send(setupPayload).expect(httpStatus.CREATED);

      // Second setup attempt must fail
      const res = await request(app).post('/v1/system/setup').send(setupPayload).expect(httpStatus.FORBIDDEN);

      expect(res.body.message).toBe('System has already been initialized');
    });

    test('should return 400 Bad Request if admin email is invalid', async () => {
      setupPayload.admin.email = 'not-an-email';
      await request(app).post('/v1/system/setup').send(setupPayload).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 Bad Request if admin password is weak', async () => {
      setupPayload.admin.password = 'weak';
      await request(app).post('/v1/system/setup').send(setupPayload).expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /v1/system/settings', () => {
    test('should return 401 if unauthenticated', async () => {
      await request(app).get('/v1/system/settings').send().expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 if authenticated user is not super_admin', async () => {
      await insertUsers([userOne]);
      await request(app)
        .get('/v1/system/settings')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 200 with system settings for super_admin', async () => {
      await insertUsers([admin]);
      const res = await request(app)
        .get('/v1/system/settings')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('clientUrl');
      expect(res.body).toHaveProperty('supportEmail');
      expect(res.body).toHaveProperty('maintenanceMode');
      expect(res.body).toHaveProperty('uploadDirectory');
      expect(res.body).toHaveProperty('maxFileSizeInMb');
      expect(res.body).toHaveProperty('emailSender');
      expect(res.body).toHaveProperty('appUpdates');
    });
  });

  describe('PATCH /v1/system/settings', () => {
    test('should return 403 if non-super_admin tries to update settings', async () => {
      await insertUsers([userOne]);
      await request(app)
        .patch('/v1/system/settings')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ supportEmail: 'hacker@evil.com' })
        .expect(httpStatus.FORBIDDEN);
    });

    test('should update settings and hot-reload in memory for super_admin', async () => {
      await insertUsers([admin]);

      const updatePayload = {
        clientUrl: 'https://newhub.university.edu',
        supportEmail: 'helpdesk@newhub.edu',
        maintenanceMode: false,
        uploadDirectory: 'new-storage-dir',
        maxFileSizeInMb: {
          monograph: 50,
          screenshot: 15,
        },
        emailSender: {
          fromName: 'New Projects Hub',
          fromAddress: 'contact@newhub.edu',
        },
        appUpdates: {
          android: {
            latestVersion: '2.0.0',
            forceUpdate: true,
          },
        },
      };

      const res = await request(app)
        .patch('/v1/system/settings')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatePayload)
        .expect(httpStatus.OK);

      expect(res.body.clientUrl).toBe(updatePayload.clientUrl);
      expect(res.body.supportEmail).toBe(updatePayload.supportEmail);
      expect(res.body.uploadDirectory).toBe(updatePayload.uploadDirectory);
      expect(res.body.maxFileSizeInMb.monograph).toBe(50);
      expect(res.body.maxFileSizeInMb.screenshot).toBe(15);
      expect(res.body.emailSender.fromName).toBe(updatePayload.emailSender.fromName);
      expect(res.body.emailSender.fromAddress).toBe(updatePayload.emailSender.fromAddress);
      expect(res.body.appUpdates.android.latestVersion).toBe('2.0.0');
      expect(res.body.appUpdates.android.forceUpdate).toBe(true);

      // Verify cached read reflects updated values immediately
      const cached = await systemConfigService.getConfig();
      expect(cached.clientUrl).toBe(updatePayload.clientUrl);
    });
  });

  describe('POST /v1/system/test-email', () => {
    test('should return 403 if non-super_admin calls test email', async () => {
      await insertUsers([userOne]);
      await request(app)
        .post('/v1/system/test-email')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ to: 'test@example.com' })
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 204 No Content when super admin sends test email', async () => {
      await insertUsers([admin]);
      jest.spyOn(emailService.transport, 'sendMail').mockResolvedValueOnce(true);

      await request(app)
        .post('/v1/system/test-email')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ to: 'admin@example.com' })
        .expect(httpStatus.NO_CONTENT);

      expect(emailService.transport.sendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('Maintenance Mode Middleware', () => {
    test('should return 503 Service Unavailable on protected and public regular routes when maintenanceMode is true', async () => {
      await insertUsers([userOne]);
      await SystemConfig.create({
        _id: 'global',
        isInitialized: true,
        maintenanceMode: true,
      });

      // Regular route for student
      const res = await request(app)
        .get('/v1/tags')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.SERVICE_UNAVAILABLE);

      expect(res.body.message).toContain('scheduled maintenance');
    });

    test('should still allow access to /v1/system/status during maintenance mode', async () => {
      await SystemConfig.create({
        _id: 'global',
        isInitialized: true,
        maintenanceMode: true,
      });

      const res = await request(app).get('/v1/system/status').send().expect(httpStatus.OK);
      expect(res.body.maintenanceMode).toBe(true);
    });

    test('should allow super_admin through during maintenance mode', async () => {
      await insertUsers([admin]);
      await SystemConfig.create({
        _id: 'global',
        isInitialized: true,
        maintenanceMode: true,
      });

      // Super admin can access settings even in maintenance mode
      await request(app)
        .get('/v1/system/settings')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);
    });
  });
});
