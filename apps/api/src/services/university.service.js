const httpStatus = require('http-status');
const { University, Faculty, User, Project } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a university
 * @param {Object} universityBody
 * @returns {Promise<University>}
 */
const createUniversity = async (universityBody) => {
  const existing = await University.findOne({ domain: universityBody.domain.toLowerCase() });
  if (existing) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Domain already taken');
  }
  return University.create(universityBody);
};

/**
 * Query for universities
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sorting criteria
 * @param {number} [options.limit] - Maximum number of results per page
 * @param {number} [options.page] - Current page
 * @returns {Promise<QueryResult>}
 */
const queryUniversities = async (filter, options) => {
  return University.paginate(filter, options);
};

/**
 * Get university by id
 * @param {ObjectId} id
 * @returns {Promise<University>}
 */
const getUniversityById = async (id) => {
  return University.findById(id);
};

/**
 * Update university by id
 * @param {ObjectId} universityId
 * @param {Object} updateBody
 * @returns {Promise<University>}
 */
const updateUniversityById = async (universityId, updateBody) => {
  const university = await getUniversityById(universityId);
  if (!university) {
    throw new ApiError(httpStatus.NOT_FOUND, 'University not found');
  }
  if (updateBody.domain) {
    const existing = await University.findOne({
      domain: updateBody.domain.toLowerCase(),
      _id: { $ne: universityId },
    });
    if (existing) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Domain already taken');
    }
  }
  Object.assign(university, updateBody);
  await university.save();
  return university;
};

/**
 * Delete university by id
 * @param {ObjectId} universityId
 * @returns {Promise<University>}
 */
const deleteUniversityById = async (universityId) => {
  const university = await getUniversityById(universityId);
  if (!university) {
    throw new ApiError(httpStatus.NOT_FOUND, 'University not found');
  }
  const facultyCount = await Faculty.countDocuments({ universityId });
  if (facultyCount > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete university with existing faculties. Remove faculties first.');
  }
  const userCount = await User.countDocuments({ universityId });
  if (userCount > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot delete university with existing users. Reassign or remove users first.'
    );
  }
  const projectCount = await Project.countDocuments({ universityId });
  if (projectCount > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete university with existing projects. Remove projects first.');
  }
  await university.remove();
  return university;
};

module.exports = {
  createUniversity,
  queryUniversities,
  getUniversityById,
  updateUniversityById,
  deleteUniversityById,
};
