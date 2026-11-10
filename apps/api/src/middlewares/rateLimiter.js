const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
});

// Stricter limiter for OTP-related endpoints.
// Does NOT skip successful requests — requesting a new OTP is the attack surface.
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: { code: 429, message: 'Too many verification requests. Please wait before requesting a new code.' },
});

module.exports = {
  authLimiter,
  otpLimiter,
};
