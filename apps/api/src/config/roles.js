const allRoles = {
  student: [
    'getTags',
    'getInstitutions',
    'createProject',
    'manageOwnProject',
    'submitProject',
    'getNotifications',
  ],
  teacher: [
    'getUsers',
    'getTags',
    'manageTags',
    'getInstitutions',
    'reviewProject',
    'getNotifications',
  ],
  faculty_dean: [
    'getUsers',
    'manageUsers',
    'getTags',
    'manageTags',
    'getInstitutions',
    'manageInstitutions',
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
    'getInstitutions',
    'manageInstitutions',
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


