const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const shortIdPlugin = require('../utils/shortId-pulgin');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: 'User',
    },

    projectId: {
      type: String,
      ref: 'Project',
    },

    type: {
      type: String,
      enum: ['ACCEPTED', 'REJECTED'],
    },

    title: {
      type: String,
    },

    message: {
      type: String,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

notificationSchema.plugin(toJSON);
notificationSchema.plugin(paginate);

const Notification = mongoose.model('Notification', notificationSchema, 'notifications');

notificationSchema.plugin(shortIdPlugin);
module.exports = Notification;
