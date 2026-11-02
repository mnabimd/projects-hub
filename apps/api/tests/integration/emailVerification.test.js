const request = require('supertest');
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { userOne, unverifiedUser, unverifiedAdmin, insertUsers } = require('../fixtures/user.fixture');
const {
  unverifiedUserAccessToken,
  unverifiedAdminAccessToken,
} = require('../fixtures/token.fixture');
const { universityOne, insertUniversities } = require('../fixtures/university.fixture');
const { tagOne, insertTags } = require('../fixtures/tag.fixture');

setupTestDB();

describe('Email verification gating (isEmailVerified = false)', () => {
  beforeEach(async () => {
    await insertUsers([unverifiedUser, unverifiedAdmin, userOne]);
    await insertUniversities([universityOne]);
    await insertTags([tagOne]);
  });

  describe('Protected endpoints return 403 for unverified accounts', () => {
    test('POST /v1/universities should return 403 even for admin if email is not verified', async () => {
      const res = await request(app)
        .post('/v1/universities')
        .set('Authorization', `Bearer ${unverifiedAdminAccessToken}`)
        .send({
          name: 'Unverified Test University',
          domain: 'unverified.edu.af',
        })
        .expect(httpStatus.FORBIDDEN);

      expect(res.body.message).toBe('Please verify your email before accessing this resource');
    });

    test('POST /v1/tags should return 403 even for admin if email is not verified', async () => {
      const res = await request(app)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${unverifiedAdminAccessToken}`)
        .send({
          name: 'GraphQL',
          category: 'backend',
        })
        .expect(httpStatus.FORBIDDEN);

      expect(res.body.message).toBe('Please verify your email before accessing this resource');
    });

    test('GET /v1/users should return 403 even for admin if email is not verified', async () => {
      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${unverifiedAdminAccessToken}`)
        .expect(httpStatus.FORBIDDEN);

      expect(res.body.message).toBe('Please verify your email before accessing this resource');
    });

    test('PATCH /v1/users/:userId should return 403 for unverified user modifying account', async () => {
      const res = await request(app)
        .patch(`/v1/users/${unverifiedUser._id}`)
        .set('Authorization', `Bearer ${unverifiedUserAccessToken}`)
        .send({ fullName: 'Updated Name' })
        .expect(httpStatus.FORBIDDEN);

      expect(res.body.message).toBe('Please verify your email before accessing this resource');
    });

    test('DELETE /v1/users/:userId should return 403 for unverified user deleting account', async () => {
      const res = await request(app)
        .delete(`/v1/users/${unverifiedUser._id}`)
        .set('Authorization', `Bearer ${unverifiedUserAccessToken}`)
        .expect(httpStatus.FORBIDDEN);

      expect(res.body.message).toBe('Please verify your email before accessing this resource');
    });
  });

  describe('Allowed endpoints for unverified accounts', () => {
    test('GET /v1/users/:userId should return 200 for unverified user reading their OWN profile (allowOwnProfile bypass)', async () => {
      const res = await request(app)
        .get(`/v1/users/${unverifiedUser._id}`)
        .set('Authorization', `Bearer ${unverifiedUserAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        id: unverifiedUser._id.toHexString(),
        email: unverifiedUser.email,
        isEmailVerified: false,
      });
    });

    test('GET /v1/users/:userId should return 403 when unverified user tries to access ANOTHER user profile', async () => {
      await request(app)
        .get(`/v1/users/${userOne._id}`)
        .set('Authorization', `Bearer ${unverifiedUserAccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });

    test('Public GET /v1/universities should return 200 for unverified accounts without requiring verification', async () => {
      await request(app).get('/v1/universities').expect(httpStatus.OK);
    });

    test('Public GET /v1/tags should return 200 for unverified accounts without requiring verification', async () => {
      await request(app).get('/v1/tags').expect(httpStatus.OK);
    });
  });
});
