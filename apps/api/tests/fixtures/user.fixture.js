const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const faker = require('faker');
const User = require('../../src/models/user.model');

const password = 'password1';
const salt = bcrypt.genSaltSync(8);
const hashedPassword = bcrypt.hashSync(password, salt);

const userOne = {
  _id: mongoose.Types.ObjectId(),
  fullName: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'student',
  isEmailVerified: true,
};
Object.defineProperty(userOne, 'name', {
  get() {
    return this.fullName;
  },
  set(val) {
    this.fullName = val;
  },
});

const userTwo = {
  _id: mongoose.Types.ObjectId(),
  fullName: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'student',
  isEmailVerified: true,
};
Object.defineProperty(userTwo, 'name', {
  get() {
    return this.fullName;
  },
  set(val) {
    this.fullName = val;
  },
});

const admin = {
  _id: mongoose.Types.ObjectId(),
  fullName: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'super_admin',
  isEmailVerified: true,
};

// A student whose email is NOT verified — used to test requireEmailVerified guard.
const unverifiedUser = {
  _id: mongoose.Types.ObjectId(),
  fullName: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'student',
  isEmailVerified: false,
};
Object.defineProperty(unverifiedUser, 'name', {
  get() {
    return this.fullName;
  },
  set(val) {
    this.fullName = val;
  },
});

// A super_admin whose email is NOT verified — used to test that email verification gates even privileged roles.
const unverifiedAdmin = {
  _id: mongoose.Types.ObjectId(),
  fullName: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'super_admin',
  isEmailVerified: false,
};
Object.defineProperty(unverifiedAdmin, 'name', {
  get() {
    return this.fullName;
  },
  set(val) {
    this.fullName = val;
  },
});

Object.defineProperty(admin, 'name', {
  get() {
    return this.fullName;
  },
  set(val) {
    this.fullName = val;
  },
});

const { universityOne } = require('./university.fixture');
const { facultyOne } = require('./faculty.fixture');

const superAdmin = admin;

const institutionAdmin = {
  _id: mongoose.Types.ObjectId(),
  fullName: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'admin',
  universityId: universityOne._id,
  isEmailVerified: true,
};
Object.defineProperty(institutionAdmin, 'name', {
  get() {
    return this.fullName;
  },
  set(val) {
    this.fullName = val;
  },
});

const facultyDeanUser = {
  _id: mongoose.Types.ObjectId(),
  fullName: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'faculty_dean',
  universityId: universityOne._id,
  facultyId: facultyOne._id,
  isEmailVerified: true,
};
Object.defineProperty(facultyDeanUser, 'name', {
  get() {
    return this.fullName;
  },
  set(val) {
    this.fullName = val;
  },
});

const departmentHeadUser = {
  _id: mongoose.Types.ObjectId(),
  fullName: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'department_head',
  universityId: universityOne._id,
  facultyId: facultyOne._id,
  departmentId: facultyOne.departments[0]._id,
  isEmailVerified: true,
};
Object.defineProperty(departmentHeadUser, 'name', {
  get() {
    return this.fullName;
  },
  set(val) {
    this.fullName = val;
  },
});

const teacherUser = {
  _id: mongoose.Types.ObjectId(),
  fullName: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'teacher',
  universityId: universityOne._id,
  facultyId: facultyOne._id,
  departmentId: facultyOne.departments[0]._id,
  isEmailVerified: true,
};
Object.defineProperty(teacherUser, 'name', {
  get() {
    return this.fullName;
  },
  set(val) {
    this.fullName = val;
  },
});

const studentUser = {
  _id: mongoose.Types.ObjectId(),
  fullName: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'student',
  universityId: universityOne._id,
  facultyId: facultyOne._id,
  departmentId: facultyOne.departments[0]._id,
  studentId: '2023-CS-001',
  isEmailVerified: true,
};
Object.defineProperty(studentUser, 'name', {
  get() {
    return this.fullName;
  },
  set(val) {
    this.fullName = val;
  },
});

const insertUsers = async (users) => {
  await User.insertMany(
    users.map((user) => ({
      ...user,
      fullName: user.fullName || user.name,
      // Preserve the explicit isEmailVerified value; fall back to true so that
      // general-purpose fixtures (userOne, userTwo, admin) don't get blocked by
      // requireEmailVerified on routes that are unrelated to email-verification.
      isEmailVerified: user.isEmailVerified !== undefined ? user.isEmailVerified : true,
      passwordHash: hashedPassword,
    }))
  );
};

module.exports = {
  userOne,
  userTwo,
  admin,
  superAdmin,
  institutionAdmin,
  facultyDeanUser,
  departmentHeadUser,
  teacherUser,
  studentUser,
  unverifiedUser,
  unverifiedAdmin,
  insertUsers,
};
