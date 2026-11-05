const moment = require('moment');
const config = require('../../src/config/config');
const { tokenTypes } = require('../../src/config/tokens');
const tokenService = require('../../src/services/token.service');
const {
  userOne,
  admin,
  superAdmin,
  institutionAdmin,
  facultyDeanUser,
  departmentHeadUser,
  teacherUser,
  studentUser,
  unverifiedUser,
  unverifiedAdmin,
} = require('./user.fixture');

const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
const userOneAccessToken = tokenService.generateToken(userOne._id, accessTokenExpires, tokenTypes.ACCESS);
const adminAccessToken = tokenService.generateToken(admin._id, accessTokenExpires, tokenTypes.ACCESS);
const superAdminAccessToken = tokenService.generateToken(superAdmin._id, accessTokenExpires, tokenTypes.ACCESS);
const institutionAdminAccessToken = tokenService.generateToken(institutionAdmin._id, accessTokenExpires, tokenTypes.ACCESS);
const facultyDeanAccessToken = tokenService.generateToken(facultyDeanUser._id, accessTokenExpires, tokenTypes.ACCESS);
const departmentHeadAccessToken = tokenService.generateToken(departmentHeadUser._id, accessTokenExpires, tokenTypes.ACCESS);
const teacherAccessToken = tokenService.generateToken(teacherUser._id, accessTokenExpires, tokenTypes.ACCESS);
const studentAccessToken = tokenService.generateToken(studentUser._id, accessTokenExpires, tokenTypes.ACCESS);
const unverifiedUserAccessToken = tokenService.generateToken(unverifiedUser._id, accessTokenExpires, tokenTypes.ACCESS);
const unverifiedAdminAccessToken = tokenService.generateToken(unverifiedAdmin._id, accessTokenExpires, tokenTypes.ACCESS);

module.exports = {
  userOneAccessToken,
  adminAccessToken,
  superAdminAccessToken,
  institutionAdminAccessToken,
  facultyDeanAccessToken,
  departmentHeadAccessToken,
  teacherAccessToken,
  studentAccessToken,
  unverifiedUserAccessToken,
  unverifiedAdminAccessToken,
};
