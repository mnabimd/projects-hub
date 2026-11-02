const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { universityValidation, facultyValidation } = require('../../validations');
const { universityController, facultyController } = require('../../controllers');
const requireEmailVerified = require('../../middlewares/requireEmailVerified');

const router = express.Router();

router
  .route('/')
  .post(
    auth('manageUniversities'),
    requireEmailVerified(),
    validate(universityValidation.createUniversity),
    universityController.createUniversity
  )
  .get(validate(universityValidation.getUniversities), universityController.getUniversities);

router
  .route('/:universityId')
  .get(validate(universityValidation.getUniversity), universityController.getUniversity)
  .patch(
    auth('manageUniversities'),
    requireEmailVerified(),
    validate(universityValidation.updateUniversity),
    universityController.updateUniversity
  )
  .delete(
    auth('manageUniversities'),
    requireEmailVerified(),
    validate(universityValidation.deleteUniversity),
    universityController.deleteUniversity
  );

router
  .route('/:universityId/faculties')
  .post(
    auth('manageUniversities'),
    requireEmailVerified(),
    validate(facultyValidation.createFaculty),
    facultyController.createFaculty
  )
  .get(validate(facultyValidation.getFaculties), facultyController.getFaculties);

module.exports = router;
