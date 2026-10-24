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
  isEmailVerified: false,
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
  isEmailVerified: false,
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
  isEmailVerified: false,
};
Object.defineProperty(admin, 'name', {
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
      isEmailVerified: user.isEmailVerified !== undefined ? user.isEmailVerified : false,
      passwordHash: hashedPassword,
    }))
  );
};

module.exports = {
  userOne,
  userTwo,
  admin,
  insertUsers,
};
