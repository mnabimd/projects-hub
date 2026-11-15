const httpStatus = require('http-status');
const { Project } = require('../models');
const ApiError = require('../utils/ApiError');

const sameId = (left, right) => Boolean(left && right && left.toString() === right.toString());

const getProjectByPublicId = async (publicId) => Project.findOne({ publicId });

const isProjectLeader = (project, user) => sameId(project.leader && project.leader.userId, user && user._id);

const canViewDraft = (project, user) => {
  if (!user || user.role === 'super_admin') {
    return false;
  }

  const isMember = project.members.some((member) => sameId(member.userId, user._id));
  const isAssignedTeacher = user.role === 'teacher' && sameId(project.assignedTeacherId, user._id);
  const isMatchingDepartmentHead =
    user.role === 'department_head' &&
    sameId(user.facultyId, project.facultyId) &&
    sameId(user.departmentId, project.departmentId);
  const isMatchingFacultyDean = user.role === 'faculty_dean' && sameId(user.facultyId, project.facultyId);

  return (
    isProjectLeader(project, user) || isMember || isAssignedTeacher || isMatchingDepartmentHead || isMatchingFacultyDean
  );
};

/**
 * Create a draft from a mock proposal ID. The Proposal collection is intentionally
 * not queried in Phase 1; the unique Project.proposalId index enforces uniqueness.
 * @param {Object} user Authenticated user
 * @param {Object} projectBody Validated request body
 * @returns {Promise<Project>}
 */
const createProject = async (user, projectBody) => {
  // Public registration creates a basic student account without institutional
  // assignments. Such accounts must be enrolled before creating a project draft.
  if (user.role === 'student' && (!user.universityId || !user.facultyId || !user.departmentId)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Your student account must be assigned to a university, faculty, and department before creating a project'
    );
  }

  const existingProject = await Project.findOne({ proposalId: projectBody.proposalId });
  if (existingProject) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'A project already exists for this proposal ID');
  }

  const projectData = {
    proposalId: projectBody.proposalId,
    title: projectBody.title,
    type: projectBody.type || 'universal',
    graduationYear: projectBody.graduationYear,
    universityId: user.universityId,
    facultyId: user.facultyId,
    departmentId: user.departmentId,
    leader: {
      userId: user._id,
      kankorId: user.kankorId || 'N/A',
      fullName: user.fullName,
    },
    status: 'draft',
    versionNumber: 1,
    isLocked: false,
    members: [],
    reviews: [],
  };

  if (projectBody.monograph) {
    projectData.monograph = projectBody.monograph;
  }
  if (projectBody.software) {
    projectData.software = projectBody.software;
  }

  try {
    return await Project.create(projectData);
  } catch (error) {
    // The pre-check gives a friendly error; this also handles concurrent duplicate requests.
    if (error.code === 11000 && error.message && error.message.indexOf('proposalId') !== -1) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'A project already exists for this proposal ID');
    }
    throw error;
  }
};

/**
 * Retrieve a project by its public identifier only.
 * @param {string} publicId
 * @param {Object|null} user Authenticated user, or null for public visitors
 * @returns {Promise<Project>}
 */
const getProjectByPublicIdForUser = async (publicId, user) => {
  const project = await getProjectByPublicId(publicId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  if (project.status !== 'approved') {
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate to view this project draft');
    }
    if (!canViewDraft(project, user)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to view this project draft');
    }
  }

  return project;
};

/**
 * Deep-merge nested deliverable objects so a partial update does not erase fields.
 */
const mergeSubdocument = (existingDocument, updates) => {
  const existingValues =
    existingDocument && typeof existingDocument.toObject === 'function'
      ? existingDocument.toObject()
      : existingDocument || {};
  return { ...existingValues, ...updates };
};

/**
 * Update an unlocked draft. Phase 1 allows the project leader and super_admin,
 * as specified by Issue #19; all other roles are rejected here.
 */
const updateProjectByPublicId = async (publicId, user, updateBody) => {
  const project = await getProjectByPublicId(publicId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  if (!isProjectLeader(project, user)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the project leader can update this project');
  }

  if (project.isLocked) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Project is locked against modifications');
  }
  if (project.status !== 'draft') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot modify project in current status');
  }

  ['title', 'type', 'graduationYear'].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updateBody, field)) {
      project[field] = updateBody[field];
    }
  });

  if (updateBody.monograph) {
    project.monograph = mergeSubdocument(project.monograph, updateBody.monograph);
  }
  if (updateBody.software) {
    project.software = mergeSubdocument(project.software, updateBody.software);
  }

  await project.save();
  return project;
};

/**
 * Delete a project using the role-specific rules agreed for Issue #19:
 * - students may delete only their own unlocked drafts;
 * - a faculty dean may clean up projects inside their own faculty;
 * - super_admin has no DELETE exception.
 */
const deleteProjectByPublicId = async (publicId, user) => {
  const project = await getProjectByPublicId(publicId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  if (user.role === 'faculty_dean') {
    if (!sameId(user.facultyId, project.facultyId)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only delete projects in your faculty');
    }
  } else if (user.role === 'student' && isProjectLeader(project, user)) {
    if (project.isLocked) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Project is locked and cannot be deleted');
    }
    if (project.status !== 'draft') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete project after formal submission');
    }
  } else {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to delete this project');
  }

  await project.remove();
};

module.exports = {
  createProject,
  getProjectByPublicIdForUser,
  updateProjectByPublicId,
  deleteProjectByPublicId,
};
