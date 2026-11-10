const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createFaculty = {
  params: Joi.object().keys({
    universityId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    departments: Joi.array().items(
      Joi.object().keys({
        name: Joi.string().required().trim(),
      })
    ),
  }),
};

const getFaculties = {
  params: Joi.object().keys({
    universityId: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getFaculty = {
  params: Joi.object().keys({
    facultyId: Joi.string().required().custom(objectId),
  }),
};

const updateFaculty = {
  params: Joi.object().keys({
    facultyId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
    })
    .min(1),
};

const deleteFaculty = {
  params: Joi.object().keys({
    facultyId: Joi.string().required().custom(objectId),
  }),
};

const createDepartment = {
  params: Joi.object().keys({
    facultyId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
  }),
};

const deleteDepartment = {
  params: Joi.object().keys({
    facultyId: Joi.string().required().custom(objectId),
    departmentId: Joi.string().required().custom(objectId),
  }),
};

module.exports = {
  createFaculty,
  getFaculties,
  getFaculty,
  updateFaculty,
  deleteFaculty,
  createDepartment,
  deleteDepartment,
};
