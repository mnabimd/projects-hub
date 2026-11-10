const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { facultyValidation } = require('../../validations');
const { facultyController } = require('../../controllers');
const requireEmailVerified = require('../../middlewares/requireEmailVerified');

const router = express.Router();

// Public read route (no auth needed)
router.get('/:facultyId', validate(facultyValidation.getFaculty), facultyController.getFaculty);

// All write routes require auth + verified email
router.use(auth('manageUniversities'));
router.use(requireEmailVerified());

router.patch('/:facultyId', validate(facultyValidation.updateFaculty), facultyController.updateFaculty);
router.delete('/:facultyId', validate(facultyValidation.deleteFaculty), facultyController.deleteFaculty);
router.post('/:facultyId/departments', validate(facultyValidation.createDepartment), facultyController.addDepartment);
router.delete(
  '/:facultyId/departments/:departmentId',
  validate(facultyValidation.deleteDepartment),
  facultyController.removeDepartment
);

module.exports = router;
