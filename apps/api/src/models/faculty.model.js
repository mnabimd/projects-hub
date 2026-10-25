const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

// Departments are stored inside a Faculty document (not in a separate collection).
const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
  },
  {
    // Mongoose gives each department its own ObjectId, as required in the PDF
    _id: true,
    id: false,
  }
);

const facultySchema = new mongoose.Schema(
  {
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'University',
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    departments: {
      type: [departmentSchema],
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

facultySchema.index({ universityId: 1 });

facultySchema.plugin(toJSON);
facultySchema.plugin(paginate);

const Faculty = mongoose.model('Faculty', facultySchema, 'faculties');

module.exports = Faculty;
