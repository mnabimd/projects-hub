const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { TechnologyTag } = require('../../src/models');
const { userOne, admin, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');
const { tagOne, tagTwo, insertTags } = require('../fixtures/tag.fixture');

setupTestDB();

describe('Technology Tag routes', () => {
  describe('POST /v1/tags', () => {
    let newTag;

    beforeEach(() => {
      newTag = {
        name: 'Express.js',
        category: 'backend',
      };
    });

    test('should return 201 and successfully create new tag if data is ok', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newTag)
        .expect(httpStatus.CREATED);

      expect(res.body).toMatchObject({
        id: expect.anything(),
        name: newTag.name,
        category: newTag.category,
        slug: 'express-js',
      });

      const dbTag = await TechnologyTag.findById(res.body.id);
      expect(dbTag).toBeDefined();
      expect(dbTag.name).toBe(newTag.name);
      expect(dbTag.slug).toBe('express-js');
    });

    test('should return 401 error if access token is missing', async () => {
      await request(app).post('/v1/tags').send(newTag).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if user does not have manageTags permission', async () => {
      await insertUsers([userOne]);

      await request(app)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newTag)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 400 error if tag with same name/slug already exists', async () => {
      await insertUsers([admin]);
      await insertTags([tagOne]);

      const duplicateTag = {
        name: 'Node.js',
        category: 'backend',
      };

      await request(app)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(duplicateTag)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if name is missing', async () => {
      await insertUsers([admin]);

      await request(app)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ category: 'backend' })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /v1/tags', () => {
    test('should return 200 and apply the default query options', async () => {
      await insertTags([tagOne, tagTwo]);

      const res = await request(app).get('/v1/tags').expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 2,
      });
      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].name).toBe(tagOne.name);
    });

    test('should correctly filter tags by category', async () => {
      await insertTags([tagOne, tagTwo]);

      const res = await request(app).get('/v1/tags').query({ category: 'frontend' }).expect(httpStatus.OK);

      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].name).toBe(tagTwo.name);
      expect(res.body.results[0].category).toBe('frontend');
    });
  });

  describe('GET /v1/tags/:tagId', () => {
    test('should return 200 and the tag object if tagId is valid', async () => {
      await insertTags([tagOne]);

      const res = await request(app).get(`/v1/tags/${tagOne._id}`).expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        id: tagOne._id.toHexString(),
        name: tagOne.name,
        category: tagOne.category,
        slug: tagOne.slug,
      });
    });

    test('should return 400 error if tagId is not a valid mongo id', async () => {
      await request(app).get('/v1/tags/invalidId').expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if tag is not found', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      await request(app).get(`/v1/tags/${nonExistentId}`).expect(httpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /v1/tags/:tagId', () => {
    test('should return 204 if data is ok', async () => {
      await insertUsers([admin]);
      await insertTags([tagOne]);

      await request(app)
        .delete(`/v1/tags/${tagOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      const dbTag = await TechnologyTag.findById(tagOne._id);
      expect(dbTag).toBeNull();
    });

    test('should return 401 error if access token is missing', async () => {
      await insertTags([tagOne]);

      await request(app).delete(`/v1/tags/${tagOne._id}`).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if user does not have manageTags permission', async () => {
      await insertUsers([userOne]);
      await insertTags([tagOne]);

      await request(app)
        .delete(`/v1/tags/${tagOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 404 error if tag is not found', async () => {
      await insertUsers([admin]);
      const nonExistentId = '507f1f77bcf86cd799439011';

      await request(app)
        .delete(`/v1/tags/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });
});
