const allRoles = {
  student: [],
  teacher: ['getUsers'],
  faculty_dean: ['getUsers', 'manageUsers'],
  super_admin: ['getUsers', 'manageUsers'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};


