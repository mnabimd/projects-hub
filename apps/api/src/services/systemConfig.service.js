const httpStatus = require('http-status');
const { SystemConfig, User } = require('../models');
const ApiError = require('../utils/ApiError');
const userService = require('./user.service');
const tokenService = require('./token.service');

let cachedConfig = null;

/**
 * Invalidate in-memory cached configuration
 */
const invalidateCache = () => {
  cachedConfig = null;
};

/**
 * Get or initialize system configuration document
 * @returns {Promise<SystemConfig>}
 */
const getConfig = async () => {
  if (cachedConfig) {
    return cachedConfig;
  }

  let config = await SystemConfig.findById('global');
  if (!config) {
    config = await SystemConfig.create({ _id: 'global' });
  }

  cachedConfig = config;
  return cachedConfig;
};

/**
 * Get system status (initialization and maintenance status)
 * @returns {Promise<Object>}
 */
const getSystemStatus = async () => {
  const config = await getConfig();
  const superAdminCount = await User.countDocuments({ role: 'super_admin' });
  const isInitialized = Boolean(config.isInitialized && superAdminCount > 0);

  return {
    isInitialized,
    setupRequired: !isInitialized,
    maintenanceMode: Boolean(config.maintenanceMode),
  };
};

/**
 * Get mobile application updates metadata
 * @returns {Promise<Object>}
 */
const getAppUpdates = async () => {
  const config = await getConfig();
  return config.appUpdates;
};

/**
 * First-run bootstrap setup
 * @param {Object} setupBody
 * @returns {Promise<Object>}
 */
const setupSystem = async (setupBody) => {
  const currentStatus = await getSystemStatus();
  if (currentStatus.isInitialized) {
    throw new ApiError(httpStatus.FORBIDDEN, 'System has already been initialized');
  }

  // 1. Create root super admin
  const adminUser = await userService.createUser({
    ...setupBody.admin,
    role: 'super_admin',
    isEmailVerified: true,
  });

  // 2. Generate auth tokens for immediate login
  const tokens = await tokenService.generateAuthTokens(adminUser);

  // 3. Update system configuration with initial values
  let config = await SystemConfig.findById('global');
  if (!config) {
    config = new SystemConfig({ _id: 'global' });
  }

  config.isInitialized = true;
  config.initializedAt = new Date();
  config.initializedBy = adminUser.id;

  if (setupBody.clientUrl) config.clientUrl = setupBody.clientUrl;
  if (setupBody.supportEmail) config.supportEmail = setupBody.supportEmail;
  if (setupBody.maintenanceMode !== undefined) config.maintenanceMode = setupBody.maintenanceMode;
  if (setupBody.uploadDirectory) config.uploadDirectory = setupBody.uploadDirectory;

  if (setupBody.maxFileSizeInMb) {
    if (setupBody.maxFileSizeInMb.monograph) config.maxFileSizeInMb.monograph = setupBody.maxFileSizeInMb.monograph;
    if (setupBody.maxFileSizeInMb.screenshot) config.maxFileSizeInMb.screenshot = setupBody.maxFileSizeInMb.screenshot;
  }

  if (setupBody.emailSender) {
    if (setupBody.emailSender.fromName) config.emailSender.fromName = setupBody.emailSender.fromName;
    if (setupBody.emailSender.fromAddress) config.emailSender.fromAddress = setupBody.emailSender.fromAddress;
  }

  if (setupBody.appUpdates) {
    if (setupBody.appUpdates.android) {
      config.appUpdates.android = { ...config.appUpdates.android, ...setupBody.appUpdates.android };
    }
    if (setupBody.appUpdates.ios) {
      config.appUpdates.ios = { ...config.appUpdates.ios, ...setupBody.appUpdates.ios };
    }
  }

  await config.save();
  cachedConfig = config;

  return {
    user: adminUser,
    tokens,
    config,
  };
};

/**
 * Update system configuration
 * @param {Object} updateBody
 * @returns {Promise<SystemConfig>}
 */
const updateConfig = async (updateBody) => {
  const config = await getConfig();

  if (updateBody.clientUrl !== undefined) config.clientUrl = updateBody.clientUrl;
  if (updateBody.supportEmail !== undefined) config.supportEmail = updateBody.supportEmail;
  if (updateBody.maintenanceMode !== undefined) config.maintenanceMode = updateBody.maintenanceMode;
  if (updateBody.uploadDirectory !== undefined) config.uploadDirectory = updateBody.uploadDirectory;

  if (updateBody.maxFileSizeInMb) {
    if (updateBody.maxFileSizeInMb.monograph !== undefined) {
      config.maxFileSizeInMb.monograph = updateBody.maxFileSizeInMb.monograph;
    }
    if (updateBody.maxFileSizeInMb.screenshot !== undefined) {
      config.maxFileSizeInMb.screenshot = updateBody.maxFileSizeInMb.screenshot;
    }
  }

  if (updateBody.emailSender) {
    if (updateBody.emailSender.fromName !== undefined) {
      config.emailSender.fromName = updateBody.emailSender.fromName;
    }
    if (updateBody.emailSender.fromAddress !== undefined) {
      config.emailSender.fromAddress = updateBody.emailSender.fromAddress;
    }
  }

  if (updateBody.appUpdates) {
    if (updateBody.appUpdates.android) {
      config.appUpdates.android = { ...config.appUpdates.android.toObject(), ...updateBody.appUpdates.android };
    }
    if (updateBody.appUpdates.ios) {
      config.appUpdates.ios = { ...config.appUpdates.ios.toObject(), ...updateBody.appUpdates.ios };
    }
  }

  await config.save();
  cachedConfig = config;

  return config;
};

module.exports = {
  getConfig,
  getSystemStatus,
  getAppUpdates,
  setupSystem,
  updateConfig,
  invalidateCache,
};
