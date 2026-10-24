const mongoose = require('mongoose');
const { TechnologyTag } = require('../../src/models');

const tagOne = {
  _id: mongoose.Types.ObjectId(),
  name: 'Node.js',
  category: 'backend',
  slug: 'node-js',
};

const tagTwo = {
  _id: mongoose.Types.ObjectId(),
  name: 'React',
  category: 'frontend',
  slug: 'react',
};

const insertTags = async (tags) => {
  await TechnologyTag.insertMany(tags);
};

module.exports = {
  tagOne,
  tagTwo,
  insertTags,
};
