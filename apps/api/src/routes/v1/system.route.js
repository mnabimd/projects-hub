const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { systemValidation } = require('../../validations');
const { systemController } = require('../../controllers');

const router = express.Router();

router.get('/status', systemController.getStatus);
router.get('/app-updates', systemController.getAppUpdates);
router.post('/setup', validate(systemValidation.setup), systemController.setup);

router
  .route('/settings')
  .get(auth('manageSystem'), systemController.getSettings)
  .patch(auth('manageSystem'), validate(systemValidation.updateSettings), systemController.updateSettings);

router.post('/test-email', auth('manageSystem'), validate(systemValidation.testEmail), systemController.testEmail);

module.exports = router;
