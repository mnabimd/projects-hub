const express = require('express');
const auth = require('../../middlewares/auth');
const requireEmailVerified = require('../../middlewares/requireEmailVerified');
const validate = require('../../middlewares/validate');
const { projectValidation } = require('../../validations');
const { projectController } = require('../../controllers');

const router = express.Router();

router.post(
  '/',
  auth('createProject'),
  requireEmailVerified(),
  validate(projectValidation.createProject),
  projectController.createProject
);

// Approved projects are public; optional JWT auth is needed to authorize draft access
router.get('/:projectId', auth.optional, validate(projectValidation.getProject), projectController.getProject);

router.patch(
  '/:projectId',
  auth('manageOwnProject'),
  requireEmailVerified(),
  validate(projectValidation.updateProject),
  projectController.updateProject
);

// Faculty dean deletion is scoped in the service, so this route authenticates
// without requiring manageOwnProject (which faculty_dean does not have)
router.delete(
  '/:projectId',
  auth(),
  requireEmailVerified(),
  validate(projectValidation.deleteProject),
  projectController.deleteProject
);

module.exports = router;
