const mongoose = require('mongoose');
const { Faculty } = require('../../src/models');
const { universityOne } = require('./university.fixture');

const facultyOne = {
  _id: mongoose.Types.ObjectId(),
  universityId: universityOne._id,
  name: 'Faculty of Computer Science',
  departments: [
    {
      _id: mongoose.Types.ObjectId(),
      name: 'Software Engineering',
    },
    {
      _id: mongoose.Types.ObjectId(),
      name: 'Information Systems',
    },
  ],
};

const facultyTwo = {
  _id: mongoose.Types.ObjectId(),
  universityId: universityOne._id,
  name: 'Faculty of Engineering',
  departments: [
    {
      _id: mongoose.Types.ObjectId(),
      name: 'Civil Engineering',
    },
  ],
};

const insertFaculties = async (faculties) => {
  await Faculty.insertMany(faculties);
};

module.exports = {
  facultyOne,
  facultyTwo,
  insertFaculties,
};
