const mongoose = require('mongoose');
const { toJSON, paginate, publicId } = require('./plugins');

const { ObjectId } = mongoose.Schema.Types;

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      ref: 'User',
      required: true,
    },
    kankorId: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
    id: false,
  }
);

const proposalReviewSchema = new mongoose.Schema(
  {
    reviewerId: {
      type: ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: ['approve', 'reject', 'request_revision'],
      required: true,
    },
    feedbackText: {
      type: String,
      required: true,
      trim: true,
    },
    versionAtReview: {
      type: Number,
      required: true,
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

const proposalSchema = new mongoose.Schema(
  {
    universityId: {
      type: ObjectId,
      ref: 'University',
      required: true,
      index: true,
    },
    facultyId: {
      type: ObjectId,
      ref: 'Faculty',
      required: true,
      index: true,
    },
    // Department is an embedded subdocument in Faculty, so reference is stored as ObjectId
    departmentId: {
      type: ObjectId,
      required: true,
      index: true,
    },

    leader: {
      type: memberSchema,
      required: true,
    },
    members: {
      type: [memberSchema],
      default: [],
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['universal', 'science'],
      default: 'universal',
    },
    submissionMode: {
      type: String,
      enum: ['pdf', 'structured', 'flexible'],
      required: true,
    },

    pdfFileUrl: {
      type: String,
      trim: true,
    },
    structuredContent: {
      introduction: {
        type: String,
        trim: true,
      },
      problemStatement: {
        type: String,
        trim: true,
      },
      objectives: {
        type: [String],
        default: [],
      },
      preliminaryMethodology: {
        type: String,
        trim: true,
      },
      customFields: {
        type: Map,
        of: String,
        default: {},
      },
    },

    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'revision_requested', 'approved', 'rejected'],
      default: 'draft',
      index: true,
    },
    versionNumber: {
      type: Number,
      default: 1,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },

    assignedReviewerId: {
      type: ObjectId,
      ref: 'User',
      default: null,
    },
    reviews: {
      type: [proposalReviewSchema],
      default: [],
    },

    projectId: {
      type: ObjectId,
      ref: 'Project',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup and scoping
proposalSchema.index({ 'leader.userId': 1, status: 1 });
proposalSchema.index({ 'members.userId': 1, status: 1 });
proposalSchema.index({ departmentId: 1, status: 1, createdAt: -1 });
proposalSchema.index({ facultyId: 1, status: 1 });
proposalSchema.index({ universityId: 1, status: 1 });
proposalSchema.index({ title: 'text' });

proposalSchema.plugin(toJSON);
proposalSchema.plugin(paginate);
proposalSchema.plugin(publicId, { prefix: 'prp' });

const Proposal = mongoose.model('Proposal', proposalSchema, 'proposals');

module.exports = Proposal;
