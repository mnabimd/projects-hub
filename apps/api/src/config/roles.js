const allRoles = {
  student: ['getTags', 'getUniversities', 'createProject', 'manageOwnProject', 'submitProject', 'getNotifications'],
  teacher: ['getUsers', 'getTags', 'manageTags', 'getUniversities', 'reviewProject', 'getNotifications'],
  department_head: ['getUsers', 'manageUsers', 'getTags', 'getUniversities', 'reviewProject', 'getNotifications'],
  department_head: [
    'getUsers',
    'manageUsers',
    'getTags',
    'getUniversities',
    'reviewProject',
    'getNotifications',
  ],
  faculty_dean: [
    'getUsers',
    'manageUsers',
    'getTags',
    'manageTags',
    'getUniversities',
    'manageUniversities',
    'assignSupervisor',
    'reviewProject',
    'publishProject',
    'getNotifications',
  ],
  admin: ['getUsers', 'manageUsers', 'getUniversities', 'manageUniversities', 'getTags', 'manageTags', 'getNotifications'],
  admin: [
    'getUsers',
    'manageUsers',
    'getUniversities',
    'manageUniversities',
    'getTags',
    'manageTags',
    'getNotifications',
  ],
  super_admin: [
    'getUsers',
    'manageUsers',
    'getTags',
    'manageTags',
    'getUniversities',
    'manageUniversities',
    'createProject',
    'manageOwnProject',
    'submitProject',
    'assignSupervisor',
    'reviewProject',
    'publishProject',
    'getNotifications',
    'manageSystem',
  ],
};

const roleHierarchy = {
  super_admin: ['admin', 'faculty_dean', 'department_head', 'teacher', 'student'],
  admin: ['faculty_dean', 'department_head', 'teacher', 'student'],
  faculty_dean: ['department_head', 'teacher', 'student'],
  department_head: ['teacher', 'student'],
  teacher: [],
  student: [],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
  roleHierarchy,
};
