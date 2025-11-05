const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Allow null for public certificates
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    dateOfIssue: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'generated', 'issued'],
      default: 'generated',
    },
    pdfPath: {
      type: String,
      // Path to the generated PDF file
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for efficient queries
certificateSchema.index({ userId: 1, dateOfIssue: -1 });
certificateSchema.index({ certificateId: 1 });

// Generate unique certificate ID
certificateSchema.statics.generateCertificateId = function () {
  const prefix = 'CERT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Create certificate
certificateSchema.statics.createCertificate = async function (userId, userName) {
  const certificateId = this.generateCertificateId();
  
  const certificate = await this.create({
    certificateId,
    userId,
    userName,
    dateOfIssue: new Date(),
    status: 'generated',
  });

  return certificate;
};

// Get user's certificates
certificateSchema.statics.getUserCertificates = async function (userId, limit = 50) {
  return await this.find({ userId })
    .sort({ dateOfIssue: -1 })
    .limit(limit)
    .lean();
};

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;

