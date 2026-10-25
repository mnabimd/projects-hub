const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { Faculty, University, User, Project } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a faculty under a university
 * @param {ObjectId} universityId
 * @param {Object} facultyBody
 * @returns {Promise<Faculty>}
 */
const createFaculty = async (universityId, facultyBody) => {
  const university = await University.findById(universityId);
  if (!university) {
    throw new ApiError(httpStatus.NOT_FOUND, 'University not found');
  }
  return Faculty.create({
    ...facultyBody,
    universityId,
  });
};

/**
 * Query for faculties of a university
 * @param {ObjectId} universityId
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryFacultiesByUniversity = async (universityId, filter, options) => {
  const university = await University.findById(universityId);
  if (!university) {
    throw new ApiError(httpStatus.NOT_FOUND, 'University not found');
  }
  return Faculty.paginate({ ...filter, universityId }, options);
};

/**
 * Get faculty by id
 * @param {ObjectId} id
 * @returns {Promise<Faculty>}
 */
const getFacultyById = async (id) => {
  return Faculty.findById(id);
};

/**
 * Update faculty by id
 * @param {ObjectId} facultyId
 * @param {Object} updateBody
 * @returns {Promise<Faculty>}
 */
const updateFacultyById = async (facultyId, updateBody) => {
  const faculty = await getFacultyById(facultyId);
  if (!faculty) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Faculty not found');
  }
  Object.assign(faculty, updateBody);
  await faculty.save();
  return faculty;
};

/**
 * Delete faculty by id
 * @param {ObjectId} facultyId
 * @returns {Promise<Faculty>}
 */
const deleteFacultyById = async (facultyId) => {
  const faculty = await getFacultyById(facultyId);
  if (!faculty) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Faculty not found');
  }
  const userCount = await User.countDocuments({ facultyId });
  if (userCount > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete faculty with existing users. Reassign or remove users first.');
  }
  const projectCount = await Project.countDocuments({ facultyId });
  if (projectCount > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete faculty with existing projects. Remove projects first.');
  }
  await faculty.remove();
  return faculty;
};

/**
 * Add an embedded department to a faculty
 * @param {ObjectId} facultyId
 * @param {Object} departmentBody
 * @returns {Promise<Object>}
 */
const addDepartment = async (facultyId, departmentBody) => {
  const faculty = await getFacultyById(facultyId);
  if (!faculty) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Faculty not found');
  }
  const duplicate = faculty.departments.some((d) => d.name.toLowerCase() === departmentBody.name.toLowerCase().trim());
  if (duplicate) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Department already exists in this faculty');
  }
  const newDepartment = {
    _id: mongoose.Types.ObjectId(),
    name: departmentBody.name.trim(),
  };
  await Faculty.updateOne({ _id: facultyId }, { $push: { departments: newDepartment } });
  return newDepartment;
};

/**
 * Remove an embedded department from a faculty
 * @param {ObjectId} facultyId
 * @param {ObjectId} departmentId
 * @returns {Promise<void>}
 */
const removeDepartment = async (facultyId, departmentId) => {
  const faculty = await getFacultyById(facultyId);
  if (!faculty) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Faculty not found');
  }
  const exists = faculty.departments.some((d) => d._id && d._id.toString() === departmentId.toString());
  if (!exists) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Department not found in faculty');
  }
  const userCount = await User.countDocuments({ departmentId });
  if (userCount > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot delete department with assigned users. Reassign or remove users first.'
    );
  }
  const projectCount = await Project.countDocuments({ departmentId });
  if (projectCount > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete department with existing projects. Remove projects first.');
  }
  await Faculty.updateOne({ _id: facultyId }, { $pull: { departments: { _id: departmentId } } });
};

module.exports = {
  createFaculty,
  queryFacultiesByUniversity,
  getFacultyById,
  updateFacultyById,
  deleteFacultyById,
  addDepartment,
  removeDepartment,
};
