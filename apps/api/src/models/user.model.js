const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');

// the field names and four roles follow the database design pdf

const userSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'University',
    },

    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
    },

    // Department ObjectIds belong to embedded departments in a Faculty
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    studentId: {
      type: String,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },

    // this field stores a bcrypt hash, not a plaintext password
    passwordHash: {
      type: String,
      required: true,
      private: true,
      select: false,
    },

    role: {
      type: String,
      enum: [
        'super_admin',
        'faculty_dean',
        'teacher',
        'student',
      ],
    },

    mustChangePassword: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

// Unique student IDs within an institution. A partial index avoids indexing
// staff records that do not have a studentId
userSchema.index(
  {
    studentId: 1,
    institutionId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      studentId: {
        $type: 'string',
      },
    },
  }
);

userSchema.plugin(toJSON);
userSchema.plugin(paginate);


userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const existingUser = await this.findOne({
    email: email.trim().toLowerCase(),
    _id: {
      $ne: excludeUserId,
    },
  });

  return !!existingUser;
};


userSchema.methods.setPassword = async function (plainPassword) {
  if (
    typeof plainPassword !== 'string' ||
    plainPassword.length < 8 ||
    !/[a-zA-Z]/.test(plainPassword) ||
    !/\d/.test(plainPassword)
  ) {
    throw new Error('Password must be at least 8 characters and contain a letter and a number');
  }

  this.passwordHash = await bcrypt.hash(plainPassword, 8);
};


userSchema.methods.isPasswordMatch = async function (plainPassword) {
  let hash = this.passwordHash;

  // Normal queries do not include passwordHash because select: false is set.
  if (!hash && !this.isNew) {
    const userWithHash = await this.constructor.findById(this._id).select('+passwordHash');
    hash = userWithHash && userWithHash.passwordHash;
  }

  if (!hash) {
    return false;
  }

  return bcrypt.compare(plainPassword, hash);
};

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;
