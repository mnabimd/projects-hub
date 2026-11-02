const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { facultyValidation } = require('../../validations');
const { facultyController } = require('../../controllers');
const requireEmailVerified = require('../../middlewares/requireEmailVerified');

const router = express.Router();

router
  .route('/:facultyId')
  .get(validate(facultyValidation.getFaculty), facultyController.getFaculty)
  .patch(
    auth('manageUniversities'),
    requireEmailVerified(),
    validate(facultyValidation.updateFaculty),
    facultyController.updateFaculty
  )
  .delete(
    auth('manageUniversities'),
    requireEmailVerified(),
    validate(facultyValidation.deleteFaculty),
    facultyController.deleteFaculty
  );

router
  .route('/:facultyId/departments')
  .post(
    auth('manageUniversities'),
    requireEmailVerified(),
    validate(facultyValidation.createDepartment),
    facultyController.addDepartment
  );

router
  .route('/:facultyId/departments/:departmentId')
  .delete(
    auth('manageUniversities'),
    requireEmailVerified(),
    validate(facultyValidation.deleteDepartment),
    facultyController.removeDepartment
  );

module.exports = router;
