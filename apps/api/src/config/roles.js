const allRoles = {
  student: ['getTags', 'getUniversities', 'createProject', 'manageOwnProject', 'submitProject', 'getNotifications'],
  teacher: ['getUsers', 'getTags', 'manageTags', 'getUniversities', 'reviewProject', 'getNotifications'],
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
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
