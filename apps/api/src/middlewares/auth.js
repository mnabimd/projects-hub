const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');

const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
  if (err || info || !user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
  req.user = user;

  if (requiredRights.length) {
    const userRights = roleRights.get(user.role) || [];
    const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
    if (!hasRequiredRights && req.params.userId !== user.id) {
      return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
    }
  }

  resolve();
};

const auth =
  (...requiredRights) =>
  async (req, res, next) => {
    return new Promise((resolve, reject) => {
      passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
    })
      .then(() => next())
      .catch((err) => next(err));
  };

// Allow approved projects to be read without a token, while still loading a
// valid user when a token is supplied so private draft access can be checked.
const optionalAuth = (req, res, next) => {
  if (!req.headers.authorization) {
    return next();
  }

  return passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }
    // Authentication is optional on this route. An invalid/expired token is
    // treated as anonymous so approved public projects remain publicly readable.
    if (!user) {
      return next();
    }

    req.user = user;
    return next();
  })(req, res, next);
};

auth.optional = optionalAuth;

module.exports = auth;
