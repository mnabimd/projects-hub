const request = require('supertest');
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { Faculty } = require('../../src/models');
// const { userOne, admin, insertUsers } = require('../fixtures/user.fixture');
// const { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');
const { universityOne, insertUniversities } = require('../fixtures/university.fixture');
const { facultyOne, facultyTwo, insertFaculties } = require('../fixtures/faculty.fixture');
const {
  userOne,
  admin,
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
  facultyDeanAccessToken,
  departmentHeadAccessToken,
  teacherAccessToken,
  studentAccessToken,
} = require('../fixtures/token.fixture');

setupTestDB();

describe('Faculty & Department routes', () => {
  describe('POST /v1/universities/:universityId/faculties', () => {
    let newFaculty;

    beforeEach(() => {
      newFaculty = {
        name: 'Faculty of Medicine',
        departments: [{ name: 'General Medicine' }, { name: 'Pediatrics' }],
      };
    });

    test('should return 201 and successfully create new faculty under university', async () => {
      await insertUsers([admin]);
      await insertUniversities([universityOne]);

      const res = await request(app)
        .post(`/v1/universities/${universityOne._id}/faculties`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newFaculty)
        .expect(httpStatus.CREATED);

      expect(res.body).toMatchObject({
        id: expect.anything(),
        universityId: universityOne._id.toHexString(),
        name: newFaculty.name,
        departments: expect.any(Array),
      });
      expect(res.body.departments).toHaveLength(2);
      expect(res.body.departments[0].name).toBe('General Medicine');

      const dbFaculty = await Faculty.findById(res.body.id);
      expect(dbFaculty).toBeDefined();
      expect(dbFaculty.universityId.toString()).toBe(universityOne._id.toString());
      expect(dbFaculty.departments).toHaveLength(2);
    });

    test('should return 401 if access token is missing', async () => {
      await insertUniversities([universityOne]);

      await request(app)
        .post(`/v1/universities/${universityOne._id}/faculties`)
        .send(newFaculty)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 if user lacks manageUniversities permission', async () => {
      await insertUsers([userOne]);
      await insertUniversities([universityOne]);

      await request(app)
        .post(`/v1/universities/${universityOne._id}/faculties`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newFaculty)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 404 if university does not exist', async () => {
      await insertUsers([admin]);

      await request(app)
        .post(`/v1/universities/${mongoose.Types.ObjectId()}/faculties`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newFaculty)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('GET /v1/universities/:universityId/faculties', () => {
    test('should return 200 and list faculties for the specified university', async () => {
      await insertUniversities([universityOne]);
      await insertFaculties([facultyOne, facultyTwo]);

      const res = await request(app).get(`/v1/universities/${universityOne._id}/faculties`).expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalResults: 2,
      });
      expect(res.body.results).toHaveLength(2);
    });

    test('should return 404 if university does not exist', async () => {
      await request(app).get(`/v1/universities/${mongoose.Types.ObjectId()}/faculties`).expect(httpStatus.NOT_FOUND);
    });
  });

  describe('GET /v1/faculties/:facultyId', () => {
    test('should return 200 and faculty document with embedded departments', async () => {
      await insertUniversities([universityOne]);
      await insertFaculties([facultyOne]);

      const res = await request(app).get(`/v1/faculties/${facultyOne._id}`).expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        id: facultyOne._id.toHexString(),
        name: facultyOne.name,
        departments: expect.any(Array),
      });
      expect(res.body.departments).toHaveLength(2);
    });

    test('should return 404 if faculty does not exist', async () => {
      await request(app).get(`/v1/faculties/${mongoose.Types.ObjectId()}`).expect(httpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /v1/faculties/:facultyId', () => {
    test('should return 200 and update faculty name', async () => {
      await insertUsers([admin]);
      await insertUniversities([universityOne]);
      await insertFaculties([facultyOne]);

      const res = await request(app)
        .patch(`/v1/faculties/${facultyOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'Faculty of Computer Science & AI' })
        .expect(httpStatus.OK);

      expect(res.body.name).toBe('Faculty of Computer Science & AI');

      const dbFaculty = await Faculty.findById(facultyOne._id);
      expect(dbFaculty.name).toBe('Faculty of Computer Science & AI');
    });

    test('should return 404 if faculty is not found', async () => {
      await insertUsers([admin]);

      await request(app)
        .patch(`/v1/faculties/${mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'Updated Name' })
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /v1/faculties/:facultyId', () => {
    test('should return 204 and remove faculty', async () => {
      await insertUsers([admin]);
      await insertUniversities([universityOne]);
      await insertFaculties([facultyOne]);

      await request(app)
        .delete(`/v1/faculties/${facultyOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      const dbFaculty = await Faculty.findById(facultyOne._id);
      expect(dbFaculty).toBeNull();
    });

    test('should return 400 if faculty has associated users', async () => {
      await insertUsers([admin, { ...userOne, facultyId: facultyOne._id }]);
      await insertUniversities([universityOne]);
      await insertFaculties([facultyOne]);

      await request(app)
        .delete(`/v1/faculties/${facultyOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 if faculty is not found', async () => {
      await insertUsers([admin]);

      await request(app)
        .delete(`/v1/faculties/${mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('POST /v1/faculties/:facultyId/departments', () => {
    test('should return 201 and atomically append department', async () => {
      await insertUsers([admin]);
      await insertUniversities([universityOne]);
      await insertFaculties([facultyOne]);

      const res = await request(app)
        .post(`/v1/faculties/${facultyOne._id}/departments`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'Artificial Intelligence' })
        .expect(httpStatus.CREATED);

      expect(res.body).toMatchObject({
        _id: expect.anything(),
        name: 'Artificial Intelligence',
      });

      const dbFaculty = await Faculty.findById(facultyOne._id);
      expect(dbFaculty.departments).toHaveLength(3);
      expect(dbFaculty.departments.some((d) => d.name === 'Artificial Intelligence')).toBe(true);
    });

    test('should return 400 if department already exists in faculty', async () => {
      await insertUsers([admin]);
      await insertUniversities([universityOne]);
      await insertFaculties([facultyOne]);

      await request(app)
        .post(`/v1/faculties/${facultyOne._id}/departments`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'Software Engineering' })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 if faculty does not exist', async () => {
      await insertUsers([admin]);

      await request(app)
        .post(`/v1/faculties/${mongoose.Types.ObjectId()}/departments`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'Cyber Security' })
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /v1/faculties/:facultyId/departments/:departmentId', () => {
    test('should return 204 and atomically remove department', async () => {
      await insertUsers([admin]);
      await insertUniversities([universityOne]);
      await insertFaculties([facultyOne]);
      const deptToRemove = facultyOne.departments[0];

      await request(app)
        .delete(`/v1/faculties/${facultyOne._id}/departments/${deptToRemove._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      const dbFaculty = await Faculty.findById(facultyOne._id);
      expect(dbFaculty.departments).toHaveLength(1);
      expect(dbFaculty.departments.some((d) => d._id.equals(deptToRemove._id))).toBe(false);
    });

    test('should return 404 if department does not exist in faculty', async () => {
      await insertUsers([admin]);
      await insertUniversities([universityOne]);
      await insertFaculties([facultyOne]);

      await request(app)
        .delete(`/v1/faculties/${facultyOne._id}/departments/${mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('GET /v1/faculties/:facultyId/departments/:departmentId/settings', () => {
    const facultyId = facultyOne._id;
    const departmentId = facultyOne.departments[0]._id;

    const prepareTestData = async () => {
      await insertUniversities([universityOne]);
      await insertFaculties([facultyOne]);
    };

    test('should return 200 and effective department proposal settings', async () => {
      await prepareTestData();

      const res = await request(app)
        .get(`/v1/faculties/${facultyId}/departments/${departmentId}/settings`)
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        submissionMode: expect.any(String),
        allowedTypes: expect.any(Array),
        maxTeamSize: expect.any(Number),
        isSubmissionOpen: expect.any(Boolean),
        submissionDeadline: null,
        guidelinesUrl: null,
        instructions: expect.any(String),
      });
    });

    test('should return department settings when they are customized', async () => {
      await prepareTestData();

      const faculty = await Faculty.findById(facultyId);
      const department = faculty.departments.id(departmentId);

      department.settings.proposal.submissionMode = 'structured';
      department.settings.proposal.maxTeamSize = 6;
      department.settings.proposal.instructions = 'Department instructions';

      await faculty.save();

      const res = await request(app)
        .get(`/v1/faculties/${facultyId}/departments/${departmentId}/settings`)
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        submissionMode: 'structured',
        maxTeamSize: 6,
        instructions: 'Department instructions',
      });
    });

    test('should return 404 if faculty does not exist', async () => {
      await prepareTestData();

      await request(app)
        .get(`/v1/faculties/${mongoose.Types.ObjectId()}/departments/${departmentId}/settings`)
        .expect(httpStatus.NOT_FOUND);
    });

    test('should return 404 if department does not exist', async () => {
      await prepareTestData();

      await request(app)
        .get(`/v1/faculties/${facultyId}/departments/${mongoose.Types.ObjectId()}/settings`)
        .expect(httpStatus.NOT_FOUND);
    });

    test('should return 400 if faculty ID is invalid', async () => {
      await prepareTestData();

      await request(app).get(`/v1/faculties/invalid-id/departments/${departmentId}/settings`).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if department ID is invalid', async () => {
      await prepareTestData();

      await request(app).get(`/v1/faculties/${facultyId}/departments/invalid-id/settings`).expect(httpStatus.BAD_REQUEST);
    });

    test('should allow public access without an access token', async () => {
      await prepareTestData();

      await request(app).get(`/v1/faculties/${facultyId}/departments/${departmentId}/settings`).expect(httpStatus.OK);
    });
  });

  describe('PATCH /v1/faculties/:facultyId/departments/:departmentId/settings', () => {
    const facultyId = facultyOne._id;
    const departmentId = facultyOne.departments[0]._id;

    const prepareTestData = async () => {
      await insertUsers([departmentHeadUser, facultyDeanUser, admin, teacherUser, studentUser]);

      await insertUniversities([universityOne]);
      await insertFaculties([facultyOne, facultyTwo]);
    };

    test('should return 200 and create proposal settings for the first time', async () => {
      await prepareTestData();

      const updateBody = {
        submissionMode: 'structured',
        allowedTypes: ['universal', 'science'],
        maxTeamSize: 6,
        isSubmissionOpen: true,
        instructions: 'Follow department guidelines.',
      };

      const response = await request(app)
        .patch(`/v1/faculties/${facultyId}/departments/${departmentId}/settings`)
        .set('Authorization', `Bearer ${departmentHeadAccessToken}`)
        .send(updateBody);

      // console.log('STATUS:', response.status);
      // console.log('ERROR BODY:', response.body);
      // console.log('STATUS:', response.status);
      // console.log('ERROR BODY:', JSON.stringify(response.body, null, 2));
      // console.log('ERROR TEXT:', response.text);
      expect(response.status).toBe(httpStatus.OK);

      const dbFaculty = await Faculty.findById(facultyId);
      const department = dbFaculty.departments.id(departmentId);

      expect(department.settings.proposal.toObject()).toMatchObject({
        ...updateBody,
        submissionDeadline: null,
        guidelinesUrl: null,
      });
    });

    test('should update only provided fields and preserve existing settings', async () => {
      await prepareTestData();

      const response = await request(app)
        .patch(`/v1/faculties/${facultyId}/departments/${departmentId}/settings`)
        .set('Authorization', `Bearer ${departmentHeadAccessToken}`)
        .send({
          instructions: 'Original instructions',
        });

      // console.log('SECOND STATUS:', response.status);
      // console.log('SECOND ERROR:', response.text);

      expect(response.status).toBe(httpStatus.OK);

      await request(app)
        .patch(`/v1/faculties/${facultyId}/departments/${departmentId}/settings`)
        .set('Authorization', `Bearer ${departmentHeadAccessToken}`)
        .send({ maxTeamSize: 8 })
        .expect(httpStatus.OK);

      const dbFaculty = await Faculty.findById(facultyId);
      const department = dbFaculty.departments.id(departmentId);

      expect(department.settings.proposal).toMatchObject({
        submissionMode: 'pdf',
        maxTeamSize: 8,
        instructions: 'Original instructions',
      });
    });

    test('should return 401 if access token is missing', async () => {
      await prepareTestData();

      await request(app)
        .patch(`/v1/faculties/${facultyId}/departments/${departmentId}/settings`)
        .send({ maxTeamSize: 5 })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 if department head updates another department in same faculty', async () => {
      await prepareTestData();

      const anotherDepartmentId = facultyOne.departments[1]._id;

      await request(app)
        .patch(`/v1/faculties/${facultyId}/departments/${anotherDepartmentId}/settings`)
        .set('Authorization', `Bearer ${departmentHeadAccessToken}`)
        .send({ maxTeamSize: 5 })
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 403 if department head updates another faculty', async () => {
      await prepareTestData();

      const anotherFacultyId = facultyTwo._id;
      const anotherDepartmentId = facultyTwo.departments[0]._id;

      await request(app)
        .patch(`/v1/faculties/${anotherFacultyId}/departments/${anotherDepartmentId}/settings`)
        .set('Authorization', `Bearer ${departmentHeadAccessToken}`)
        .send({ maxTeamSize: 5 })
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 403 for faculty dean', async () => {
      await prepareTestData();

      await request(app)
        .patch(`/v1/faculties/${facultyId}/departments/${departmentId}/settings`)
        .set('Authorization', `Bearer ${facultyDeanAccessToken}`)
        .send({ maxTeamSize: 5 })
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 403 for admin', async () => {
      await prepareTestData();

      await request(app)
        .patch(`/v1/faculties/${facultyId}/departments/${departmentId}/settings`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ maxTeamSize: 5 })
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 403 for super admin', async () => {
      await prepareTestData();

      await request(app)
        .patch(`/v1/faculties/${facultyId}/departments/${departmentId}/settings`)
        .set('Authorization', `Bearer ${superAdminAccessToken}`)
        .send({ maxTeamSize: 5 })
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 403 for teacher', async () => {
      await prepareTestData();

      await request(app)
        .patch(`/v1/faculties/${facultyId}/departments/${departmentId}/settings`)
        .set('Authorization', `Bearer ${teacherAccessToken}`)
        .send({ maxTeamSize: 5 })
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 403 for student', async () => {
      await prepareTestData();

      await request(app)
        .patch(`/v1/faculties/${facultyId}/departments/${departmentId}/settings`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({ maxTeamSize: 5 })
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 400 if maxTeamSize is greater than 10', async () => {
      await prepareTestData();

      await request(app)
        .patch(`/v1/faculties/${facultyId}/departments/${departmentId}/settings`)
        .set('Authorization', `Bearer ${departmentHeadAccessToken}`)
        .send({ maxTeamSize: 15 })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if submissionMode is invalid', async () => {
      await prepareTestData();

      await request(app)
        .patch(`/v1/faculties/${facultyId}/departments/${departmentId}/settings`)
        .set('Authorization', `Bearer ${departmentHeadAccessToken}`)
        .send({ submissionMode: 'word' })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if allowedTypes contains invalid value', async () => {
      await prepareTestData();

      await request(app)
        .patch(`/v1/faculties/${facultyId}/departments/${departmentId}/settings`)
        .set('Authorization', `Bearer ${departmentHeadAccessToken}`)
        .send({ allowedTypes: ['universal', 'invalid'] })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if request body is empty', async () => {
      await prepareTestData();

      await request(app)
        .patch(`/v1/faculties/${facultyId}/departments/${departmentId}/settings`)
        .set('Authorization', `Bearer ${departmentHeadAccessToken}`)
        .send({})
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if faculty ID is invalid', async () => {
      await prepareTestData();

      await request(app)
        .patch(`/v1/faculties/invalid-id/departments/${departmentId}/settings`)
        .set('Authorization', `Bearer ${departmentHeadAccessToken}`)
        .send({ maxTeamSize: 5 })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if department ID is invalid', async () => {
      await prepareTestData();

      await request(app)
        .patch(`/v1/faculties/${facultyId}/departments/invalid-id/settings`)
        .set('Authorization', `Bearer ${departmentHeadAccessToken}`)
        .send({ maxTeamSize: 5 })
        .expect(httpStatus.BAD_REQUEST);
    });
  });
});
