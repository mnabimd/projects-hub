const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const systemConfigSchema = mongoose.Schema(
  {
    _id: {
      type: String,
      default: 'global',
    },
    isInitialized: {
      type: Boolean,
      default: false,
    },
    initializedAt: {
      type: Date,
    },
    initializedBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },

    // 1. Client / Frontend URL
    clientUrl: {
      type: String,
      default: 'http://localhost:5173',
      trim: true,
    },

    // 2. Support Email
    supportEmail: {
      type: String,
      default: 'support@projectshub.com',
      trim: true,
      lowercase: true,
    },

    // 3. Maintenance Mode
    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    // 4. Android & iOS App Updates
    appUpdates: {
      android: {
        minVersion: { type: String, default: '1.0.0' },
        latestVersion: { type: String, default: '1.0.0' },
        forceUpdate: { type: Boolean, default: false },
        updateUrl: { type: String, default: '' },
        releaseNotes: { type: String, default: '' },
      },
      ios: {
        minVersion: { type: String, default: '1.0.0' },
        latestVersion: { type: String, default: '1.0.0' },
        forceUpdate: { type: Boolean, default: false },
        updateUrl: { type: String, default: '' },
        releaseNotes: { type: String, default: '' },
      },
    },

    // 5. Upload Directory (Local storage)
    uploadDirectory: {
      type: String,
      default: 'uploads',
      trim: true,
    },

    // 6. Max File Size In MB
    maxFileSizeInMb: {
      monograph: { type: Number, default: 25 },
      screenshot: { type: Number, default: 5 },
    },

    // 7. Email Sender Settings
    emailSender: {
      fromName: { type: String, default: 'ProjectsHub', trim: true },
      fromAddress: { type: String, default: 'no-reply@projectshub.com', trim: true, lowercase: true },
    },
  },
  {
    timestamps: true,
  }
);

systemConfigSchema.plugin(toJSON);

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema, 'system_config');

module.exports = SystemConfig;
