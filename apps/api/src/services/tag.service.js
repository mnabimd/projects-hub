const httpStatus = require('http-status');
const { TechnologyTag } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Generate a clean URL-friendly slug from string
 * @param {string} text
 * @returns {string}
 */
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

/**
 * Create a technology tag
 * @param {Object} tagBody
 * @returns {Promise<TechnologyTag>}
 */
const createTag = async (tagBody) => {
  const slug = generateSlug(tagBody.name);
  const existing = await TechnologyTag.findOne({ slug });
  if (existing) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'A tag with this name/slug already exists');
  }
  return TechnologyTag.create({
    ...tagBody,
    slug,
  });
};

/**
 * Query for technology tags
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sorting criteria
 * @param {number} [options.limit] - Maximum number of results per page
 * @param {number} [options.page] - Current page
 * @returns {Promise<QueryResult>}
 */
const queryTags = async (filter, options) => {
  return TechnologyTag.paginate(filter, options);
};

/**
 * Get tag by id
 * @param {ObjectId} id
 * @returns {Promise<TechnologyTag>}
 */
const getTagById = async (id) => {
  return TechnologyTag.findById(id);
};

/**
 * Delete tag by id
 * @param {ObjectId} tagId
 * @returns {Promise<TechnologyTag>}
 */
const deleteTagById = async (tagId) => {
  const tag = await getTagById(tagId);
  if (!tag) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tag not found');
  }
  await tag.remove();
  return tag;
};

module.exports = {
  createTag,
  queryTags,
  getTagById,
  deleteTagById,
};
