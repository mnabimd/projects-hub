const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const shortIdPlugin = require('../utils/shortId-pulgin');

const ObjectId = mongoose.Schema.Types.ObjectId;

// a copy of a team member basic information, embedded in each project
const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: 'User',
    },

    studentId: {
      type: String,
    },

    fullName: {
      type: String,
    },
  },
  {
    // leader and member objects in the PDF do not define their own _id
    _id: false,
    id: false,
  }
);

const monographSchema = new mongoose.Schema(
  {
    pdfFileUrl: {
      type: String,
    },

    abstract: {
      type: String,
    },

    keywords: {
      type: [String],
      default: [],
    },

    defenseDate: {
      type: Date,
    },

    citationCount: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
    id: false,
  }
);

const softwareSchema = new mongoose.Schema(
  {
    githubRepoUrl: {
      type: String,
    },

    liveDemoUrl: {
      type: String,
    },

    screenshots: {
      type: [String],
      default: [],
    },

    techTagIds: {
      type: [
        {
          type: ObjectId,
          ref: 'TechnologyTag',
        },
      ],
      default: [],
    },
  },
  {
    _id: false,
    id: false,
  }
);

// Unlike team members, review entries have their own ObjectId
const reviewSchema = new mongoose.Schema(
  {
    reviewerId: {
      type: ObjectId,
      ref: 'User',
    },

    action: {
      type: String,
      enum: ['approve', 'reject', 'request_revision'],
    },

    feedbackText: {
      type: String,
    },

    versionAtReview: {
      type: Number,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const projectSchema = new mongoose.Schema(
  {
    institutionId: {
      type: ObjectId,
      ref: 'University',
    },

    facultyId: {
      type: ObjectId,
      ref: 'Faculty',
    },

    // A department is embedded in a Faculty, so it has no separate model
    departmentId: {
      type: ObjectId,
    },

    graduationYear: {
      type: Number,
    },

    type: {
      type: String,
      enum: ['universal', 'science'],
    },

    title: {
      type: String,
    },

    status: {
      type: String,
      enum: [
        'draft',
        'submitted',
        'revision_requested',
        'approved',
        'rejected',
      ],
      default: 'draft',
    },

    versionNumber: {
      type: Number,
      default: 1,
    },

    isLocked: {
      type: Boolean,
      default: false,
    },

    leader: {
      type: memberSchema,
    },

    members: {
      type: [memberSchema],
      default: [],
    },

    monograph: {
      type: monographSchema,
    },

    software: {
      type: softwareSchema,
    },

    assignedTeacherId: {
      type: ObjectId,
      ref: 'User',
    },

    reviews: {
      type: [reviewSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index 1: text search across the project's title and monograph
projectSchema.index({
  title: 'text',
  'monograph.abstract': 'text',
  'monograph.keywords': 'text',
});

// Index 2: public catalog filters.
projectSchema.index({
  status: 1,
  graduationYear: -1,
  facultyId: 1,
  departmentId: 1,
  'software.techTagIds': 1,
});

// Index 3: find projects by leader or team member (indexed separately to optimize $or queries)
projectSchema.index({ 'leader.userId': 1 });
projectSchema.index({ 'members.userId': 1 });

projectSchema.plugin(toJSON);
projectSchema.plugin(paginate);

const Project = mongoose.model('Project', projectSchema, 'projects');

projectSchema.plugin(shortIdPlugin);

module.exports = Project;
