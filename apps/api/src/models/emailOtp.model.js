const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { toJSON } = require('./plugins');

const emailOtpSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
      private: true,
    },
    expires: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

emailOtpSchema.plugin(toJSON);

// MongoDB automatically removes expired OTP documents
emailOtpSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

emailOtpSchema.methods.isOtpMatch = async function (plainOtp) {
  return bcrypt.compare(plainOtp, this.otpHash);
};

emailOtpSchema.statics.hashOtp = async function (plainOtp) {
  return bcrypt.hash(plainOtp, 8);
};

const EmailOtp = mongoose.model('EmailOtp', emailOtpSchema, 'emailOtps');

module.exports = EmailOtp;
