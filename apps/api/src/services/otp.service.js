const crypto = require('crypto');
const httpStatus = require('http-status');
const moment = require('moment');
const config = require('../config/config');
const EmailOtp = require('../models/emailOtp.model');
const userService = require('./user.service');
const ApiError = require('../utils/ApiError');

const MAX_OTP_ATTEMPTS = 5;

// Produces a uniformly-random 6-digit code with no leading zeros (100000–999999)
const generateOtpCode = () => crypto.randomInt(100000, 1000000).toString();

const createEmailOtp = async (userId) => {
  const plainOtp = generateOtpCode();
  const otpHash = await EmailOtp.hashOtp(plainOtp);
  const expires = moment().add(config.otp.expirationMinutes, 'minutes').toDate();

  // Atomic upsert — replaces any existing OTP in a single DB operation,
  // avoiding the race condition of a separate deleteMany + create.
  await EmailOtp.findOneAndReplace(
    { user: userId },
    { user: userId, otpHash, expires, attempts: 0, createdAt: new Date() },
    { upsert: true }
  );

  return plainOtp;
};

const verifyEmailOtp = async (userId, otp) => {
  const otpDoc = await EmailOtp.findOne({
    user: userId,
    expires: { $gt: new Date() },
  });

  if (!otpDoc) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No valid OTP found. Please request a new verification code');
  }

  if (otpDoc.attempts >= MAX_OTP_ATTEMPTS) {
    await otpDoc.deleteOne();
    throw new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many failed attempts. Please request a new verification code');
  }

  const isMatch = await otpDoc.isOtpMatch(otp);

  if (!isMatch) {
    otpDoc.attempts += 1;

    if (otpDoc.attempts >= MAX_OTP_ATTEMPTS) {
      await otpDoc.deleteOne();
      throw new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many failed attempts. Please request a new verification code');
    }

    await otpDoc.save();

    const remaining = MAX_OTP_ATTEMPTS - otpDoc.attempts;
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid verification code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining`
    );
  }

  await userService.updateUserById(userId, { isEmailVerified: true });

  await EmailOtp.deleteMany({ user: userId });
};

module.exports = {
  createEmailOtp,
  verifyEmailOtp,
};
