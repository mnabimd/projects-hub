const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

// a university is stored in the "universities" collection
const universitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    domain: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  {
    // The PDF lists createdAt, but not updatedAt, for universities.
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

universitySchema.plugin(toJSON);
universitySchema.plugin(paginate);

const University = mongoose.model('University', universitySchema, 'universities');

module.exports = University;
