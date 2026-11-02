const moment = require('moment');
const config = require('../../src/config/config');
const { tokenTypes } = require('../../src/config/tokens');
const tokenService = require('../../src/services/token.service');
const { userOne, admin, unverifiedUser, unverifiedAdmin } = require('./user.fixture');

const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
const userOneAccessToken = tokenService.generateToken(userOne._id, accessTokenExpires, tokenTypes.ACCESS);
const adminAccessToken = tokenService.generateToken(admin._id, accessTokenExpires, tokenTypes.ACCESS);
const unverifiedUserAccessToken = tokenService.generateToken(unverifiedUser._id, accessTokenExpires, tokenTypes.ACCESS);
const unverifiedAdminAccessToken = tokenService.generateToken(unverifiedAdmin._id, accessTokenExpires, tokenTypes.ACCESS);

module.exports = {
  userOneAccessToken,
  adminAccessToken,
  unverifiedUserAccessToken,
  unverifiedAdminAccessToken,
};
