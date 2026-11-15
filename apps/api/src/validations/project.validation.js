const Joi = require('joi');
const { objectId } = require('./custom.validation');

const projectPublicId = Joi.string()
  .pattern(/^prj_[A-Za-z0-9_-]{10}$/)
  .required();

const monographFields = {
  abstract: Joi.string().trim().allow(''),
  keywords: Joi.array().items(Joi.string().trim()),
  pdfFileUrl: Joi.string().uri().allow(''),
  defenseDate: Joi.date().iso(),
};

const softwareFields = {
  githubRepoUrl: Joi.string().uri().allow(''),
  liveDemoUrl: Joi.string().uri().allow(''),
  screenshots: Joi.array().items(Joi.string().uri()).max(5),
  techTagIds: Joi.array().items(Joi.string().custom(objectId)),
};

const createProject = {
  body: Joi.object().keys({
    proposalId: Joi.string().required().custom(objectId),
    title: Joi.string().required().trim().min(3).max(300),
    type: Joi.string().valid('universal', 'science').default('universal'),
    graduationYear: Joi.number().integer().min(2000).max(2100).required(),
    monograph: Joi.object().keys(monographFields),
    software: Joi.object().keys(softwareFields),
  }),
};

const getProject = {
  params: Joi.object().keys({
    projectId: projectPublicId,
  }),
};

const updateProject = {
  params: Joi.object().keys({
    projectId: projectPublicId,
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().trim().min(3).max(300),
      type: Joi.string().valid('universal', 'science'),
      graduationYear: Joi.number().integer().min(2000).max(2100),
      monograph: Joi.object().keys(monographFields).min(1),
      software: Joi.object().keys(softwareFields).min(1),
    })
    .min(1),
};

const deleteProject = {
  params: Joi.object().keys({
    projectId: projectPublicId,
  }),
};

module.exports = {
  createProject,
  getProject,
  updateProject,
  deleteProject,
};
