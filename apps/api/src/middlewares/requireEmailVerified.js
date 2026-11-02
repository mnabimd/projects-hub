const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

const requireEmailVerified =
  (allowOwnProfile = false) =>
  (req, res, next) => {
    if (allowOwnProfile && req.user && req.params.userId === req.user.id) {
      return next();
    }

    if (!req.user || !req.user.isEmailVerified) {
      return next(new ApiError(httpStatus.FORBIDDEN, 'Please verify your email before accessing this resource'));
    }

    return next();
  };

module.exports = requireEmailVerified;
