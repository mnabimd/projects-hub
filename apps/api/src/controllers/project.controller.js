const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { projectService } = require('../services');

const createProject = catchAsync(async (req, res) => {
  const project = await projectService.createProject(req.user, req.body);
  res.status(httpStatus.CREATED).send(project);
});

const getProject = catchAsync(async (req, res) => {
  const project = await projectService.getProjectByPublicIdForUser(req.params.projectId, req.user || null);
  res.send(project);
});

const updateProject = catchAsync(async (req, res) => {
  const project = await projectService.updateProjectByPublicId(req.params.projectId, req.user, req.body);
  res.send(project);
});

const deleteProject = catchAsync(async (req, res) => {
  await projectService.deleteProjectByPublicId(req.params.projectId, req.user);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createProject,
  getProject,
  updateProject,
  deleteProject,
};
