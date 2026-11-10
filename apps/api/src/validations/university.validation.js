const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createUniversity = {
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    domain: Joi.string().required().trim().lowercase(),
  }),
};

const getUniversities = {
  query: Joi.object().keys({
    name: Joi.string(),
    domain: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUniversity = {
  params: Joi.object().keys({
    universityId: Joi.string().custom(objectId),
  }),
};

const updateUniversity = {
  params: Joi.object().keys({
    universityId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      domain: Joi.string().trim().lowercase(),
    })
    .min(1),
};

const deleteUniversity = {
  params: Joi.object().keys({
    universityId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createUniversity,
  getUniversities,
  getUniversity,
  updateUniversity,
  deleteUniversity,
};
