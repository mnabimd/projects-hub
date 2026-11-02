const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { universityValidation, facultyValidation } = require('../../validations');
const { universityController, facultyController } = require('../../controllers');
const requireEmailVerified = require('../../middlewares/requireEmailVerified');

const router = express.Router();

// Public read routes (no auth or email verification needed)
router.get('/', validate(universityValidation.getUniversities), universityController.getUniversities);
router.get('/:universityId', validate(universityValidation.getUniversity), universityController.getUniversity);
router.get('/:universityId/faculties', validate(facultyValidation.getFaculties), facultyController.getFaculties);

// All write routes require auth + verified email
router.use(auth('manageUniversities'));
router.use(requireEmailVerified());

router.post('/', validate(universityValidation.createUniversity), universityController.createUniversity);
router.patch('/:universityId', validate(universityValidation.updateUniversity), universityController.updateUniversity);
router.delete('/:universityId', validate(universityValidation.deleteUniversity), universityController.deleteUniversity);
router.post('/:universityId/faculties', validate(facultyValidation.createFaculty), facultyController.createFaculty);

module.exports = router;
