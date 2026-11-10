const mongoose = require('mongoose');
const { University } = require('../../src/models');

const universityOne = {
  _id: mongoose.Types.ObjectId(),
  name: 'Kabul University',
  domain: 'ku.edu.af',
};

const universityTwo = {
  _id: mongoose.Types.ObjectId(),
  name: 'Kandahar University',
  domain: 'kdun.edu.af',
};

const insertUniversities = async (universities) => {
  await University.insertMany(universities);
};

module.exports = {
  universityOne,
  universityTwo,
  insertUniversities,
};
