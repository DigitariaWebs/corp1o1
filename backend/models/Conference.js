const mongoose = require('mongoose');

const conferenceSchema = new mongoose.Schema(
  {
    // Conference ID (matches Stream call ID)
    id: {
      type: String,
      required: [true, 'Conference ID is required'],
      unique: true,
      trim: true,
    },

    // Password protection
    hasPassword: {
      type: Boolean,
      default: false,
      required: true,
    },

    // 4-digit PIN (only if hasPassword is true)
    pin: {
      type: String,
      required: function() {
        return this.hasPassword;
      },
      validate: {
        validator: function(v) {
          if (!this.hasPassword) return true; // PIN not required if no password
          return /^\d{4}$/.test(v); // Must be exactly 4 digits
        },
        message: 'PIN must be exactly 4 digits',
      },
    },

    // Conference creator (Clerk user ID or 'anonymous')
    createdBy: {
      type: String,
      default: 'anonymous',
    },

    // Conference status
    status: {
      type: String,
      enum: ['active', 'ended'],
      default: 'active',
    },

    // Timestamps
    startedAt: {
      type: Date,
      default: Date.now,
    },

    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
conferenceSchema.index({ id: 1 });
conferenceSchema.index({ createdBy: 1 });
conferenceSchema.index({ status: 1 });
conferenceSchema.index({ startedAt: -1 });

// Static method to find by conference ID
conferenceSchema.statics.findByConferenceId = async function(conferenceId) {
  return await this.findOne({ id: conferenceId, status: 'active' });
};

// Instance method to verify PIN
conferenceSchema.methods.verifyPin = function(inputPin) {
  if (!this.hasPassword) {
    return true; // No password required
  }
  return this.pin === inputPin;
};

// Instance method to end conference
conferenceSchema.methods.endConference = function() {
  this.status = 'ended';
  this.endedAt = new Date();
  return this.save();
};

const Conference = mongoose.model('Conference', conferenceSchema);

module.exports = Conference;

