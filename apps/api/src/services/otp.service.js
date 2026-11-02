const crypto = require('crypto');
const httpStatus = require('http-status');
const moment = require('moment');
const config = require('../config/config');
const EmailOtp = require('../models/emailOtp.model');
const userService = require('./user.service');
const ApiError = require('../utils/ApiError');

const MAX_OTP_ATTEMPTS = 5;

const generateOtpCode = () => {
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
};

const createEmailOtp = async (userId) => {
  // Remove old OTPs so the user only has one active code.
  await EmailOtp.deleteMany({ user: userId });

  const plainOtp = generateOtpCode();
  const otpHash = await EmailOtp.hashOtp(plainOtp);
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes').toDate();

  await EmailOtp.create({
    user: userId,
    otpHash,
    expires,
  });

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
  generateOtpCode,
  createEmailOtp,
  verifyEmailOtp,
};
