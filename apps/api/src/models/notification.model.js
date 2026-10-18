const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
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

module.exports = Notification;
