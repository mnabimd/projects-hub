const Joi = require('joi');
const { password, objectId } = require('./custom.validation');
const { roles } = require('../config/roles');

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    fullName: Joi.string().required(),
    role: Joi.string().required().valid('admin', 'faculty_dean', 'department_head', 'teacher', 'student'),
    universityId: Joi.string().custom(objectId),
    facultyId: Joi.string().custom(objectId),
    departmentId: Joi.string().custom(objectId),
    kankorId: Joi.string().trim().when('role', {
      is: 'student',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    fullName: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      fullName: Joi.string(),
      role: Joi.string().valid(...roles),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
