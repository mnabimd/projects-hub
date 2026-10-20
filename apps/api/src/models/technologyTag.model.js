const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');


const technologyTagSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },

  category: {
    type: String,
    trim: true,
  },

  slug: {
    type: String,
    trim: true,
  },
});

technologyTagSchema.index({ slug: 1 }, { unique: true });

technologyTagSchema.plugin(toJSON);
technologyTagSchema.plugin(paginate);

const TechnologyTag = mongoose.model('TechnologyTag', technologyTagSchema, 'technology_tags');

module.exports = TechnologyTag;
