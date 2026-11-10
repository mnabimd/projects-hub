const Joi = require('joi');
const { password } = require('./custom.validation');

const setup = {
  body: Joi.object().keys({
    admin: Joi.object()
      .keys({
        fullName: Joi.string().required(),
        email: Joi.string().required().email(),
        password: Joi.string().required().custom(password),
      })
      .required(),
    clientUrl: Joi.string().uri().allow(''),
    supportEmail: Joi.string().email().allow(''),
    maintenanceMode: Joi.boolean(),
    uploadDirectory: Joi.string().allow(''),
    maxFileSizeInMb: Joi.object().keys({
      monograph: Joi.number().min(1).max(500),
      screenshot: Joi.number().min(1).max(100),
    }),
    emailSender: Joi.object().keys({
      fromName: Joi.string().allow(''),
      fromAddress: Joi.string().email().allow(''),
    }),
    appUpdates: Joi.object().keys({
      android: Joi.object().keys({
        minVersion: Joi.string(),
        latestVersion: Joi.string(),
        forceUpdate: Joi.boolean(),
        updateUrl: Joi.string().uri().allow(''),
        releaseNotes: Joi.string().allow(''),
      }),
      ios: Joi.object().keys({
        minVersion: Joi.string(),
        latestVersion: Joi.string(),
        forceUpdate: Joi.boolean(),
        updateUrl: Joi.string().uri().allow(''),
        releaseNotes: Joi.string().allow(''),
      }),
    }),
  }),
};

const updateSettings = {
  body: Joi.object()
    .keys({
      clientUrl: Joi.string().uri(),
      supportEmail: Joi.string().email(),
      maintenanceMode: Joi.boolean(),
      uploadDirectory: Joi.string(),
      maxFileSizeInMb: Joi.object().keys({
        monograph: Joi.number().min(1).max(500),
        screenshot: Joi.number().min(1).max(100),
      }),
      emailSender: Joi.object().keys({
        fromName: Joi.string(),
        fromAddress: Joi.string().email(),
      }),
      appUpdates: Joi.object().keys({
        android: Joi.object().keys({
          minVersion: Joi.string(),
          latestVersion: Joi.string(),
          forceUpdate: Joi.boolean(),
          updateUrl: Joi.string().uri().allow(''),
          releaseNotes: Joi.string().allow(''),
        }),
        ios: Joi.object().keys({
          minVersion: Joi.string(),
          latestVersion: Joi.string(),
          forceUpdate: Joi.boolean(),
          updateUrl: Joi.string().uri().allow(''),
          releaseNotes: Joi.string().allow(''),
        }),
      }),
    })
    .min(1),
};

const testEmail = {
  body: Joi.object().keys({
    to: Joi.string().email().required(),
  }),
};

module.exports = {
  setup,
  updateSettings,
  testEmail,
};
