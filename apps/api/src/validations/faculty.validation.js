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
const getDepartmentProposalSettings = {
  params: Joi.object().keys({
    facultyId: Joi.string().custom(objectId).required(),
    departmentId: Joi.string().custom(objectId).required(),
  }),
};

const updateDepartmentProposalSettings = {
  params: Joi.object().keys({
    facultyId: Joi.string().custom(objectId).required(),
    departmentId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      submissionMode: Joi.string().valid('pdf', 'structured', 'flexible'),
      allowedTypes: Joi.array().items(Joi.string().valid('universal', 'science')).min(1),
      maxTeamSize: Joi.number().integer().min(1).max(10),
      isSubmissionOpen: Joi.boolean(),
      submissionDeadline: Joi.date().iso().allow(null),
      guidelinesUrl: Joi.string().uri().allow('', null).trim(),
      instructions: Joi.string().allow('', null).trim(),
    })
    .min(1),
};

module.exports = {
  createFaculty,
  getFaculties,
  getFaculty,
  updateFaculty,
  deleteFaculty,
  createDepartment,
  deleteDepartment,
  getDepartmentProposalSettings,
  updateDepartmentProposalSettings
};
