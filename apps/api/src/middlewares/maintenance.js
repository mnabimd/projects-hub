const mongoose = require('mongoose');
const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { systemConfigService } = require('../services');

const maintenanceMiddleware = async (req, res, next) => {
  try {
    // 1. Immediately bypass maintenance check for system routes, login, docs
    const bypassPrefixes = ['/v1/system', '/v1/auth/login', '/v1/docs'];
    const isBypass = bypassPrefixes.some((prefix) => req.originalUrl.startsWith(prefix));
    if (isBypass) {
      return next();
    }

    // 2. If MongoDB is not connected, fail open
    if (mongoose.connection.readyState !== 1) {
      return next();
    }

    const config = await systemConfigService.getConfig();
    if (!config || !config.maintenanceMode) {
      return next();
    }

    // 3. If request contains authorization header, check if user is super_admin
    if (req.headers.authorization) {
      return passport.authenticate('jwt', { session: false }, (err, user) => {
        if (!err && user && user.role === 'super_admin') {
          req.user = user;
          return next();
        }
        return next(
          new ApiError(
            httpStatus.SERVICE_UNAVAILABLE,
            'System is currently undergoing scheduled maintenance. Please try again shortly.'
          )
        );
      })(req, res, next);
    }

    return next(
      new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        'System is currently undergoing scheduled maintenance. Please try again shortly.'
      )
    );
  } catch (err) {
    // Fail open on unexpected error so requests are not disrupted
    return next();
  }
};

module.exports = maintenanceMiddleware;
