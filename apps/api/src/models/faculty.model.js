const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const departmentProposalSettingsSchema = new mongoose.Schema(
  {
    submissionMode: {
      type: String,
      enum: ['pdf', 'structured', 'flexible'],
      default: 'pdf',
    },
    allowedTypes: {
      type: [String],
      default: ['universal', 'science'],
    },
    maxTeamSize: {
      type: Number,
      default: 4,
      min: 1,
      max: 10,
    },
    isSubmissionOpen: {
      type: Boolean,
      default: true,
    },
    submissionDeadline: {
      type: Date,
      default: null,
    },
    guidelinesUrl: {
      type: String,
      default: null,
      trim: true,
    },
    instructions: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const departmentProjectSettingsSchema = new mongoose.Schema(
  {
    maxSupervisorLoad: {
      type: Number,
      default: 5,
      min: 1,
    },
    allowCrossDepartmentMembers: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const departmentSettingsSchema = new mongoose.Schema(
  {
    proposal: {
      type: departmentProposalSettingsSchema,
      default: () => ({}),
    },
    project: {
      type: departmentProjectSettingsSchema,
      default: () => ({}),
    },
  },
  { _id: false }
);

// Departments are stored inside a Faculty document (not in a separate collection).
const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    settings: {
      type: departmentSettingsSchema,
      default: () => ({}),
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
