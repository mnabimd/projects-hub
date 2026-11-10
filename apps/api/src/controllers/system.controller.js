const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { systemConfigService, emailService } = require('../services');

const getStatus = catchAsync(async (req, res) => {
  const status = await systemConfigService.getSystemStatus();
  res.send(status);
});

const getAppUpdates = catchAsync(async (req, res) => {
  const updates = await systemConfigService.getAppUpdates();
  res.send(updates);
});

const setup = catchAsync(async (req, res) => {
  const result = await systemConfigService.setupSystem(req.body);
  res.status(httpStatus.CREATED).send(result);
});

const getSettings = catchAsync(async (req, res) => {
  const config = await systemConfigService.getConfig();
  res.send(config);
});

const updateSettings = catchAsync(async (req, res) => {
  const updated = await systemConfigService.updateConfig(req.body);
  res.send(updated);
});

const testEmail = catchAsync(async (req, res) => {
  await emailService.sendTestEmail(req.body.to);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  getStatus,
  getAppUpdates,
  setup,
  getSettings,
  updateSettings,
  testEmail,
};
