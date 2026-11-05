const httpStatus = require('http-status');
const { User, University, Faculty } = require('../models');
const { roleHierarchy } = require('../config/roles');
const ApiError = require('../utils/ApiError');

/**
 * Create a user
 * @param {Object} userBody
 * @param {Object} [creatorUser]
 * @returns {Promise<User>}
 */
const createUser = async (userBody, creatorUser = null) => {
  const userData = { ...userBody };

  if (creatorUser) {
    const allowedRoles = roleHierarchy[creatorUser.role] || [];
    if (!allowedRoles.includes(userData.role)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient privileges to create this role');
    }

    if (creatorUser.role === 'super_admin') {
      if (!userData.universityId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'University is required');
      }
      if (userData.role === 'admin') {
        if (userData.facultyId || userData.departmentId) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Faculty and department must not be specified for university admin');
        }
      } else if (userData.role === 'faculty_dean') {
        if (!userData.facultyId) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Faculty is required for faculty dean');
        }
        if (userData.departmentId) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Department must not be specified for faculty dean');
        }
      } else if (userData.role === 'department_head') {
        if (!userData.facultyId || !userData.departmentId) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Faculty and department are required for department head');
        }
      } else if (userData.role === 'teacher') {
        if (!userData.facultyId) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Faculty is required for teacher');
        }
      } else if (userData.role === 'student') {
        if (!userData.facultyId || !userData.departmentId || !userData.studentId) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Faculty, department, and student ID are required for student');
        }
      }
    } else if (creatorUser.role === 'admin') {
      if (userData.universityId && userData.universityId.toString() !== creatorUser.universityId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot assign user to another university');
      }
      userData.universityId = creatorUser.universityId;

      if (userData.role === 'faculty_dean') {
        if (!userData.facultyId) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Faculty is required for faculty dean');
        }
        if (userData.departmentId) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Department must not be specified for faculty dean');
        }
      } else if (userData.role === 'department_head') {
        if (!userData.facultyId || !userData.departmentId) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Faculty and department are required for department head');
        }
      } else if (userData.role === 'teacher') {
        if (!userData.facultyId) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Faculty is required for teacher');
        }
      } else if (userData.role === 'student') {
        if (!userData.facultyId || !userData.departmentId || !userData.studentId) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Faculty, department, and student ID are required for student');
        }
      }
    } else if (creatorUser.role === 'faculty_dean') {
      if (userData.universityId && userData.universityId.toString() !== creatorUser.universityId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot assign user to another university');
      }
      if (userData.facultyId && userData.facultyId.toString() !== creatorUser.facultyId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot assign user to another faculty');
      }
      userData.universityId = creatorUser.universityId;
      userData.facultyId = creatorUser.facultyId;

      if (userData.role === 'department_head') {
        if (!userData.departmentId) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Department is required for department head');
        }
      } else if (userData.role === 'student') {
        if (!userData.departmentId || !userData.studentId) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Department and student ID are required for student');
        }
      }
    } else if (creatorUser.role === 'department_head') {
      if (userData.universityId && userData.universityId.toString() !== creatorUser.universityId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot assign user to another university');
      }
      if (userData.facultyId && userData.facultyId.toString() !== creatorUser.facultyId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot assign user to another faculty');
      }
      if (userData.departmentId && userData.departmentId.toString() !== creatorUser.departmentId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot assign user to another department');
      }
      userData.universityId = creatorUser.universityId;
      userData.facultyId = creatorUser.facultyId;
      userData.departmentId = creatorUser.departmentId;

      if (userData.role === 'student') {
        if (!userData.studentId) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Student ID is required for student');
        }
      }
    }
  }

  // Referential Integrity Validation
  if (userData.universityId) {
    const university = await University.findById(userData.universityId);
    if (!university) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'University not found');
    }
  }

  let faculty = null;
  if (userData.facultyId) {
    faculty = await Faculty.findById(userData.facultyId);
    if (!faculty) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Faculty not found');
    }
    if (userData.universityId && !faculty.universityId.equals(userData.universityId)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Faculty does not belong to specified university');
    }
  }

  if (userData.departmentId) {
    if (!faculty) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Faculty is required when department is specified');
    }
    const deptExists = faculty.departments && faculty.departments.some((dept) => dept._id.equals(userData.departmentId));
    if (!deptExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Department not found in faculty');
    }
  }

  if (userData.role === 'student' && userData.studentId && userData.universityId) {
    const existingStudent = await User.findOne({
      studentId: userData.studentId,
      universityId: userData.universityId,
    });
    if (existingStudent) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Student ID is already registered in this university');
    }
  }

  if (await User.isEmailTaken(userData.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  return User.create({
    mustChangePassword: true,
    isEmailVerified: false,
    ...userData,
  });
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {String} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Update user by id
 * @param {String} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {String} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
};
