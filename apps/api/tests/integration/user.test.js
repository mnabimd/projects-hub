const request = require('supertest');
const faker = require('faker');
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { User } = require('../../src/models');
const {
  userOne,
  userTwo,
  admin,
  superAdmin,
  institutionAdmin,
  facultyDeanUser,
  departmentHeadUser,
  teacherUser,
  studentUser,
  insertUsers,
} = require('../fixtures/user.fixture');
const {
  userOneAccessToken,
  adminAccessToken,
  superAdminAccessToken,
  institutionAdminAccessToken,
  facultyDeanAccessToken,
  departmentHeadAccessToken,
  teacherAccessToken,
  studentAccessToken,
} = require('../fixtures/token.fixture');
const { universityOne, universityTwo, insertUniversities } = require('../fixtures/university.fixture');
const { facultyOne, facultyTwo, insertFaculties } = require('../fixtures/faculty.fixture');

setupTestDB();

describe('User routes', () => {
  describe('POST /v1/users', () => {
    let newUser;

    beforeEach(async () => {
      await insertUniversities([universityOne, universityTwo]);
      await insertFaculties([facultyOne, facultyTwo]);

      newUser = {
        fullName: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        role: 'admin',
        universityId: universityOne._id,
      };
    });

    test('should return 201 and successfully create new user if data is ok', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).toMatchObject({
        id: expect.anything(),
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        isEmailVerified: false,
      });

      const dbUser = await User.findById(res.body.id);
      expect(dbUser).toBeDefined();
      expect(await dbUser.isPasswordMatch(newUser.password)).toBe(true);
      expect(dbUser).toMatchObject({
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        isEmailVerified: false,
      });
    });

    test('should return 401 error if access token is missing', async () => {
      await request(app).post('/v1/users').send(newUser).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if logged in user is student', async () => {
      await insertUsers([userOne]);

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newUser)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 400 error if email is invalid', async () => {
      await insertUsers([admin]);
      newUser.email = 'invalidEmail';

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if email is already used', async () => {
      await insertUsers([admin, userOne]);
      newUser.email = userOne.email;

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password length is less than 8 characters', async () => {
      await insertUsers([admin]);
      newUser.password = 'passwo1';

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password does not contain both letters and numbers', async () => {
      await insertUsers([admin]);
      newUser.password = 'password';

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);

      newUser.password = '1111111';

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if role is invalid', async () => {
      await insertUsers([admin]);
      newUser.role = 'invalid';

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    // =========================================================================
    // 15 Hierarchical Provisioning Scenarios
    // =========================================================================

    // Scenario 1: super_admin creates admin with valid universityId
    test('Scenario 1: super_admin can create admin with valid universityId (201 Created)', async () => {
      await insertUsers([superAdmin]);
      const targetUser = {
        fullName: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        role: 'admin',
        universityId: universityOne._id,
      };

      const res = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${superAdminAccessToken}`)
        .send(targetUser)
        .expect(httpStatus.CREATED);

      expect(res.body.role).toBe('admin');
      expect(res.body.universityId).toBe(universityOne._id.toHexString());
    });

    // Scenario 2: super_admin cannot create super_admin via /v1/users
    test('Scenario 2: super_admin cannot create super_admin via /v1/users (400 Bad Request)', async () => {
      await insertUsers([superAdmin]);
      const targetUser = {
        fullName: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        role: 'super_admin',
      };

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${superAdminAccessToken}`)
        .send(targetUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    // Scenario 3: super_admin creates student without universityId
    test('Scenario 3: super_admin cannot create student without universityId (400 Bad Request)', async () => {
      await insertUsers([superAdmin]);
      const targetUser = {
        fullName: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        role: 'student',
        facultyId: facultyOne._id,
        departmentId: facultyOne.departments[0]._id,
        kankorId: 'M27009999',
      };

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${superAdminAccessToken}`)
        .send(targetUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    // Scenario 4: admin creates faculty_dean in own university
    test('Scenario 4: admin can create faculty_dean in own university (201 Created, inherits universityId)', async () => {
      await insertUsers([institutionAdmin]);
      const targetUser = {
        fullName: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        role: 'faculty_dean',
        facultyId: facultyOne._id,
      };

      const res = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${institutionAdminAccessToken}`)
        .send(targetUser)
        .expect(httpStatus.CREATED);

      expect(res.body.role).toBe('faculty_dean');
      expect(res.body.universityId).toBe(institutionAdmin.universityId.toHexString());
      expect(res.body.facultyId).toBe(facultyOne._id.toHexString());
    });

    // Scenario 5: admin creates faculty_dean with different universityId
    test('Scenario 5: admin cannot create faculty_dean targeting different universityId (403 Forbidden)', async () => {
      await insertUsers([institutionAdmin]);
      const targetUser = {
        fullName: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        role: 'faculty_dean',
        universityId: universityTwo._id,
        facultyId: facultyOne._id,
      };

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${institutionAdminAccessToken}`)
        .send(targetUser)
        .expect(httpStatus.FORBIDDEN);
    });

    // Scenario 6: admin creates admin or super_admin
    test('Scenario 6: admin cannot create admin (403 Forbidden) or super_admin (400 Bad Request)', async () => {
      await insertUsers([institutionAdmin]);

      // Attempting to create admin
      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${institutionAdminAccessToken}`)
        .send({
          fullName: faker.name.findName(),
          email: faker.internet.email().toLowerCase(),
          password: 'password1',
          role: 'admin',
        })
        .expect(httpStatus.FORBIDDEN);

      // Attempting to create super_admin
      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${institutionAdminAccessToken}`)
        .send({
          fullName: faker.name.findName(),
          email: faker.internet.email().toLowerCase(),
          password: 'password1',
          role: 'super_admin',
        })
        .expect(httpStatus.BAD_REQUEST);
    });

    // Scenario 7: faculty_dean creates department_head in own faculty
    test('Scenario 7: faculty_dean can create department_head in own faculty (201 Created)', async () => {
      await insertUsers([facultyDeanUser]);
      const targetUser = {
        fullName: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        role: 'department_head',
        departmentId: facultyOne.departments[0]._id,
      };

      const res = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${facultyDeanAccessToken}`)
        .send(targetUser)
        .expect(httpStatus.CREATED);

      expect(res.body.role).toBe('department_head');
      expect(res.body.universityId).toBe(facultyDeanUser.universityId.toHexString());
      expect(res.body.facultyId).toBe(facultyDeanUser.facultyId.toHexString());
      expect(res.body.departmentId).toBe(facultyOne.departments[0]._id.toHexString());
    });

    // Scenario 8: faculty_dean creates faculty_dean or admin
    test('Scenario 8: faculty_dean cannot create faculty_dean or admin (403 Forbidden)', async () => {
      await insertUsers([facultyDeanUser]);

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${facultyDeanAccessToken}`)
        .send({
          fullName: faker.name.findName(),
          email: faker.internet.email().toLowerCase(),
          password: 'password1',
          role: 'faculty_dean',
          facultyId: facultyOne._id,
        })
        .expect(httpStatus.FORBIDDEN);

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${facultyDeanAccessToken}`)
        .send({
          fullName: faker.name.findName(),
          email: faker.internet.email().toLowerCase(),
          password: 'password1',
          role: 'admin',
        })
        .expect(httpStatus.FORBIDDEN);
    });

    // Scenario 9: faculty_dean creates user targeting different faculty
    test('Scenario 9: faculty_dean cannot create user targeting different faculty (403 Forbidden)', async () => {
      await insertUsers([facultyDeanUser]);

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${facultyDeanAccessToken}`)
        .send({
          fullName: faker.name.findName(),
          email: faker.internet.email().toLowerCase(),
          password: 'password1',
          role: 'teacher',
          facultyId: facultyTwo._id,
        })
        .expect(httpStatus.FORBIDDEN);
    });

    // Scenario 10: department_head creates teacher and student in own department
    test('Scenario 10: department_head can create teacher and student in own department (201 Created)', async () => {
      await insertUsers([departmentHeadUser]);

      // Create teacher
      const teacherRes = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${departmentHeadAccessToken}`)
        .send({
          fullName: 'Prof. Tester',
          email: 'teacher.dept@ku.edu.af',
          password: 'password1',
          role: 'teacher',
        })
        .expect(httpStatus.CREATED);

      expect(teacherRes.body.role).toBe('teacher');
      expect(teacherRes.body.universityId).toBe(departmentHeadUser.universityId.toHexString());
      expect(teacherRes.body.facultyId).toBe(departmentHeadUser.facultyId.toHexString());
      expect(teacherRes.body.departmentId).toBe(departmentHeadUser.departmentId.toHexString());

      // Create student
      const studentRes = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${departmentHeadAccessToken}`)
        .send({
          fullName: 'Student Tester',
          email: 'student.dept@ku.edu.af',
          password: 'password1',
          role: 'student',
          kankorId: 'M27001235',
        })
        .expect(httpStatus.CREATED);

      expect(studentRes.body.role).toBe('student');
      expect(studentRes.body.kankorId).toBe('M27001235');
      expect(studentRes.body.universityId).toBe(departmentHeadUser.universityId.toHexString());
      expect(studentRes.body.facultyId).toBe(departmentHeadUser.facultyId.toHexString());
      expect(studentRes.body.departmentId).toBe(departmentHeadUser.departmentId.toHexString());
    });

    // Scenario 11: department_head creates administrative role (dean, admin)
    test('Scenario 11: department_head cannot create administrative role (403 Forbidden)', async () => {
      await insertUsers([departmentHeadUser]);

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${departmentHeadAccessToken}`)
        .send({
          fullName: faker.name.findName(),
          email: faker.internet.email().toLowerCase(),
          password: 'password1',
          role: 'faculty_dean',
          facultyId: facultyOne._id,
        })
        .expect(httpStatus.FORBIDDEN);

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${departmentHeadAccessToken}`)
        .send({
          fullName: faker.name.findName(),
          email: faker.internet.email().toLowerCase(),
          password: 'password1',
          role: 'admin',
        })
        .expect(httpStatus.FORBIDDEN);
    });

    // Scenario 12: department_head creates user targeting different department
    test('Scenario 12: department_head cannot create user targeting different department (403 Forbidden)', async () => {
      await insertUsers([departmentHeadUser]);

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${departmentHeadAccessToken}`)
        .send({
          fullName: faker.name.findName(),
          email: faker.internet.email().toLowerCase(),
          password: 'password1',
          role: 'teacher',
          departmentId: facultyOne.departments[1]._id,
        })
        .expect(httpStatus.FORBIDDEN);
    });

    // Scenario 13: teacher / student calls POST /v1/users
    test('Scenario 13: teacher or student cannot call POST /v1/users (403 Forbidden)', async () => {
      await insertUsers([teacherUser, studentUser]);

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${teacherAccessToken}`)
        .send({
          fullName: faker.name.findName(),
          email: faker.internet.email().toLowerCase(),
          password: 'password1',
          role: 'student',
          kankorId: 'M27001236',
        })
        .expect(httpStatus.FORBIDDEN);

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({
          fullName: faker.name.findName(),
          email: faker.internet.email().toLowerCase(),
          password: 'password1',
          role: 'student',
          kankorId: 'M27001237',
        })
        .expect(httpStatus.FORBIDDEN);
    });

    // Scenario 14: Duplicate kankorId within same university
    test('Scenario 14: cannot create student with duplicate kankorId in same university (400 Bad Request)', async () => {
      await insertUsers([departmentHeadUser]);

      // First student
      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${departmentHeadAccessToken}`)
        .send({
          fullName: 'Student Original',
          email: 'orig@ku.edu.af',
          password: 'password1',
          role: 'student',
          kankorId: 'M27001238',
        })
        .expect(httpStatus.CREATED);

      // Duplicate kankorId in same university
      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${departmentHeadAccessToken}`)
        .send({
          fullName: 'Student Duplicate',
          email: 'dup@ku.edu.af',
          password: 'password1',
          role: 'student',
          kankorId: 'M27001238',
        })
        .expect(httpStatus.BAD_REQUEST);
    });

    // Scenario 15: Create user with non-existent facultyId or departmentId
    test('Scenario 15: cannot create user with non-existent facultyId or departmentId (400 Bad Request)', async () => {
      await insertUsers([superAdmin]);
      const nonExistentId = mongoose.Types.ObjectId();

      // Non-existent facultyId
      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${superAdminAccessToken}`)
        .send({
          fullName: faker.name.findName(),
          email: faker.internet.email().toLowerCase(),
          password: 'password1',
          role: 'teacher',
          universityId: universityOne._id,
          facultyId: nonExistentId,
        })
        .expect(httpStatus.BAD_REQUEST);

      // Non-existent departmentId
      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${superAdminAccessToken}`)
        .send({
          fullName: faker.name.findName(),
          email: faker.internet.email().toLowerCase(),
          password: 'password1',
          role: 'student',
          universityId: universityOne._id,
          facultyId: facultyOne._id,
          departmentId: nonExistentId,
          kankorId: 'M27009999',
        })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /v1/users', () => {
    test('should return 200 and apply the default query options', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(3);
      expect(res.body.results[0]).toMatchObject({
        id: userOne._id.toHexString(),
        fullName: userOne.fullName,
        email: userOne.email,
        role: userOne.role,
        isEmailVerified: userOne.isEmailVerified,
      });
    });

    test('should return 401 if access token is missing', async () => {
      await insertUsers([userOne, userTwo, admin]);

      await request(app).get('/v1/users').send().expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 if a non-admin is trying to access all users', async () => {
      await insertUsers([userOne, userTwo, admin]);

      await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });

    test('should correctly apply filter on fullName field', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ fullName: userOne.fullName })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 1,
      });
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].id).toBe(userOne._id.toHexString());
    });

    test('should correctly apply filter on role field', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ role: 'student' })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 2,
      });
      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].id).toBe(userOne._id.toHexString());
      expect(res.body.results[1].id).toBe(userTwo._id.toHexString());
    });

    test('should correctly sort the returned array if descending sort param is specified', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ sortBy: 'role:desc' })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(3);
      expect(res.body.results[0].id).toBe(admin._id.toHexString());
      expect(res.body.results[1].id).toBe(userOne._id.toHexString());
      expect(res.body.results[2].id).toBe(userTwo._id.toHexString());
    });

    test('should correctly sort the returned array if ascending sort param is specified', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ sortBy: 'role:asc' })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(3);
      expect(res.body.results[0].id).toBe(userOne._id.toHexString());
      expect(res.body.results[1].id).toBe(userTwo._id.toHexString());
      expect(res.body.results[2].id).toBe(admin._id.toHexString());
    });

    test('should correctly sort the returned array if multiple sorting criteria are specified', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ sortBy: 'role:desc,fullName:asc' })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(3);

      const expectedOrder = [userOne, userTwo, admin].sort((a, b) => {
        if (a.role < b.role) {
          return 1;
        }
        if (a.role > b.role) {
          return -1;
        }
        return a.fullName < b.fullName ? -1 : 1;
      });

      expectedOrder.forEach((user, index) => {
        expect(res.body.results[index].id).toBe(user._id.toHexString());
      });
    });

    test('should limit returned array if limit param is specified', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ limit: 2 })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 2,
        totalPages: 2,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].id).toBe(userOne._id.toHexString());
      expect(res.body.results[1].id).toBe(userTwo._id.toHexString());
    });

    test('should return the correct page if page and limit params are specified', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ page: 2, limit: 2 })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 2,
        limit: 2,
        totalPages: 2,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].id).toBe(admin._id.toHexString());
    });
  });

  describe('GET /v1/users/:userId', () => {
    test('should return 200 and the user object if data is ok', async () => {
      await insertUsers([userOne]);

      const res = await request(app)
        .get(`/v1/users/${userOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toMatchObject({
        id: userOne._id.toHexString(),
        email: userOne.email,
        fullName: userOne.fullName,
        role: userOne.role,
        isEmailVerified: userOne.isEmailVerified,
      });
    });

    test('should return 401 error if access token is missing', async () => {
      await insertUsers([userOne]);

      await request(app).get(`/v1/users/${userOne._id}`).send().expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if user is trying to get another user', async () => {
      await insertUsers([userOne, userTwo]);

      await request(app)
        .get(`/v1/users/${userTwo._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 200 and the user object if admin is trying to get another user', async () => {
      await insertUsers([userOne, admin]);

      await request(app)
        .get(`/v1/users/${userOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await insertUsers([admin]);

      await request(app)
        .get('/v1/users/invalidId')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if user is not found', async () => {
      await insertUsers([admin]);

      await request(app)
        .get(`/v1/users/${userOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /v1/users/:userId', () => {
    test('should return 204 if data is ok', async () => {
      await insertUsers([userOne]);

      await request(app)
        .delete(`/v1/users/${userOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(userOne._id);
      expect(dbUser).toBeNull();
    });

    test('should return 401 error if access token is missing', async () => {
      await insertUsers([userOne]);

      await request(app).delete(`/v1/users/${userOne._id}`).send().expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if user is trying to delete another user', async () => {
      await insertUsers([userOne, userTwo]);

      await request(app)
        .delete(`/v1/users/${userTwo._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 204 if admin is trying to delete another user', async () => {
      await insertUsers([userOne, admin]);

      await request(app)
        .delete(`/v1/users/${userOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await insertUsers([admin]);

      await request(app)
        .delete('/v1/users/invalidId')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if user already is not found', async () => {
      await insertUsers([admin]);

      await request(app)
        .delete(`/v1/users/${userOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /v1/users/:userId', () => {
    test('should return 200 and successfully update user if data is ok', async () => {
      await insertUsers([userOne]);
      const updateBody = {
        fullName: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'newPassword1',
      };

      const res = await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toMatchObject({
        id: userOne._id.toHexString(),
        fullName: updateBody.fullName,
        email: updateBody.email,
        role: 'student',
        isEmailVerified: userOne.isEmailVerified,
      });

      const dbUser = await User.findById(userOne._id);
      expect(dbUser).toBeDefined();
      expect(await dbUser.isPasswordMatch(updateBody.password)).toBe(true);
      expect(dbUser).toMatchObject({ fullName: updateBody.fullName, email: updateBody.email, role: 'student' });
    });

    test('should return 401 error if access token is missing', async () => {
      await insertUsers([userOne]);
      const updateBody = { fullName: faker.name.findName() };

      await request(app).patch(`/v1/users/${userOne._id}`).send(updateBody).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 if user is updating another user', async () => {
      await insertUsers([userOne, userTwo]);
      const updateBody = { fullName: faker.name.findName() };

      await request(app)
        .patch(`/v1/users/${userTwo._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 200 and successfully update user if admin is updating another user', async () => {
      await insertUsers([userOne, admin]);
      const updateBody = { fullName: faker.name.findName() };

      await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);
    });

    test('should return 404 if admin is updating another user that is not found', async () => {
      await insertUsers([admin]);
      const updateBody = { fullName: faker.name.findName() };

      await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.NOT_FOUND);
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await insertUsers([admin]);
      const updateBody = { fullName: faker.name.findName() };

      await request(app)
        .patch(`/v1/users/invalidId`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if email is invalid', async () => {
      await insertUsers([userOne]);
      const updateBody = { email: 'invalidEmail' };

      await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if email is already taken', async () => {
      await insertUsers([userOne, userTwo]);
      const updateBody = { email: userTwo.email };

      await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should not return 400 if email is my email', async () => {
      await insertUsers([userOne]);
      const updateBody = { email: userOne.email };

      await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);
    });

    test('should return 400 if password length is less than 8 characters', async () => {
      await insertUsers([userOne]);
      const updateBody = { password: 'passwo1' };

      await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if password does not contain both letters and numbers', async () => {
      await insertUsers([userOne]);
      const updateBody = { password: 'password' };

      await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);

      updateBody.password = '11111111';

      await request(app)
        .patch(`/v1/users/${userOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });
  });
});
