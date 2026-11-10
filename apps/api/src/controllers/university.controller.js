const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { universityService } = require('../services');

const createUniversity = catchAsync(async (req, res) => {
  const university = await universityService.createUniversity(req.body);
  res.status(httpStatus.CREATED).send(university);
});

const getUniversities = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'domain']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await universityService.queryUniversities(filter, options);
  res.send(result);
});

const getUniversity = catchAsync(async (req, res) => {
  const university = await universityService.getUniversityById(req.params.universityId);
  if (!university) {
    throw new ApiError(httpStatus.NOT_FOUND, 'University not found');
  }
  res.send(university);
});

const updateUniversity = catchAsync(async (req, res) => {
  const university = await universityService.updateUniversityById(req.params.universityId, req.body);
  res.send(university);
});

const deleteUniversity = catchAsync(async (req, res) => {
  await universityService.deleteUniversityById(req.params.universityId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createUniversity,
  getUniversities,
  getUniversity,
  updateUniversity,
  deleteUniversity,
};
