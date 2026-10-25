const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { facultyService } = require('../services');

const createFaculty = catchAsync(async (req, res) => {
  const faculty = await facultyService.createFaculty(req.params.universityId, req.body);
  res.status(httpStatus.CREATED).send(faculty);
});

const getFaculties = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await facultyService.queryFacultiesByUniversity(req.params.universityId, filter, options);
  res.send(result);
});

const getFaculty = catchAsync(async (req, res) => {
  const faculty = await facultyService.getFacultyById(req.params.facultyId);
  if (!faculty) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Faculty not found');
  }
  res.send(faculty);
});

const updateFaculty = catchAsync(async (req, res) => {
  const faculty = await facultyService.updateFacultyById(req.params.facultyId, req.body);
  res.send(faculty);
});

const deleteFaculty = catchAsync(async (req, res) => {
  await facultyService.deleteFacultyById(req.params.facultyId);
  res.status(httpStatus.NO_CONTENT).send();
});

const addDepartment = catchAsync(async (req, res) => {
  const department = await facultyService.addDepartment(req.params.facultyId, req.body);
  res.status(httpStatus.CREATED).send(department);
});

const removeDepartment = catchAsync(async (req, res) => {
  await facultyService.removeDepartment(req.params.facultyId, req.params.departmentId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createFaculty,
  getFaculties,
  getFaculty,
  updateFaculty,
  deleteFaculty,
  addDepartment,
  removeDepartment,
};
