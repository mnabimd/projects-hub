const request = require('supertest');
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { University, Faculty } = require('../../src/models');
const { userOne, admin, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');
const { universityOne, universityTwo, insertUniversities } = require('../fixtures/university.fixture');

setupTestDB();

describe('University routes', () => {
  describe('POST /v1/universities', () => {
    let newUniversity;

    beforeEach(() => {
      newUniversity = {
        name: 'Herat University',
        domain: 'hu.edu.af',
      };
    });

    test('should return 201 and successfully create new university if data is ok', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .post('/v1/universities')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUniversity)
        .expect(httpStatus.CREATED);

      expect(res.body).toMatchObject({
        id: expect.anything(),
        name: newUniversity.name,
        domain: newUniversity.domain,
      });

      const dbUniversity = await University.findById(res.body.id);
      expect(dbUniversity).toBeDefined();
      expect(dbUniversity.name).toBe(newUniversity.name);
      expect(dbUniversity.domain).toBe(newUniversity.domain);
    });

    test('should return 401 error if access token is missing', async () => {
      await request(app).post('/v1/universities').send(newUniversity).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if user does not have manageUniversities permission', async () => {
      await insertUsers([userOne]);

      await request(app)
        .post('/v1/universities')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newUniversity)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 400 error if domain already taken', async () => {
      await insertUsers([admin]);
      await insertUniversities([universityOne]);
      newUniversity.domain = universityOne.domain;

      await request(app)
        .post('/v1/universities')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUniversity)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if name is missing', async () => {
      await insertUsers([admin]);
      delete newUniversity.name;

      await request(app)
        .post('/v1/universities')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUniversity)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /v1/universities', () => {
    test('should return 200 and list of universities', async () => {
      await insertUniversities([universityOne, universityTwo]);

      const res = await request(app).get('/v1/universities').expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 2,
      });
      expect(res.body.results).toHaveLength(2);
    });

    test('should correctly filter universities by name', async () => {
      await insertUniversities([universityOne, universityTwo]);

      const res = await request(app).get('/v1/universities').query({ name: 'Kabul University' }).expect(httpStatus.OK);

      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].id).toBe(universityOne._id.toHexString());
    });

    test('should correctly filter universities by domain', async () => {
      await insertUniversities([universityOne, universityTwo]);

      const res = await request(app).get('/v1/universities').query({ domain: 'kdun.edu.af' }).expect(httpStatus.OK);

      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].id).toBe(universityTwo._id.toHexString());
    });
  });

  describe('GET /v1/universities/:universityId', () => {
    test('should return 200 and the university object if data is ok', async () => {
      await insertUniversities([universityOne]);

      const res = await request(app).get(`/v1/universities/${universityOne._id}`).expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        id: universityOne._id.toHexString(),
        name: universityOne.name,
        domain: universityOne.domain,
      });
    });

    test('should return 400 error if universityId is not a valid mongo id', async () => {
      await request(app).get('/v1/universities/invalidId').expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if university is not found', async () => {
      await request(app).get(`/v1/universities/${mongoose.Types.ObjectId()}`).expect(httpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /v1/universities/:universityId', () => {
    test('should return 200 and successfully update university if data is ok', async () => {
      await insertUsers([admin]);
      await insertUniversities([universityOne]);
      const updateBody = {
        name: 'Kabul National University',
      };

      const res = await request(app)
        .patch(`/v1/universities/${universityOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        id: universityOne._id.toHexString(),
        name: updateBody.name,
        domain: universityOne.domain,
      });

      const dbUniversity = await University.findById(universityOne._id);
      expect(dbUniversity.name).toBe(updateBody.name);
    });

    test('should return 400 error if updated domain is already taken', async () => {
      await insertUsers([admin]);
      await insertUniversities([universityOne, universityTwo]);

      await request(app)
        .patch(`/v1/universities/${universityOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ domain: universityTwo.domain })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if university is not found', async () => {
      await insertUsers([admin]);

      await request(app)
        .patch(`/v1/universities/${mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'New Name' })
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /v1/universities/:universityId', () => {
    test('should return 204 if data is ok', async () => {
      await insertUsers([admin]);
      await insertUniversities([universityOne]);

      await request(app)
        .delete(`/v1/universities/${universityOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      const dbUniversity = await University.findById(universityOne._id);
      expect(dbUniversity).toBeNull();
    });

    test('should return 400 if university has existing faculties', async () => {
      await insertUsers([admin]);
      await insertUniversities([universityOne]);
      await Faculty.create({
        universityId: universityOne._id,
        name: 'Faculty of Science',
      });

      await request(app)
        .delete(`/v1/universities/${universityOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if university has existing users', async () => {
      await insertUsers([admin, { ...userOne, universityId: universityOne._id }]);
      await insertUniversities([universityOne]);

      await request(app)
        .delete(`/v1/universities/${universityOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if university is not found', async () => {
      await insertUsers([admin]);

      await request(app)
        .delete(`/v1/universities/${mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });
});
