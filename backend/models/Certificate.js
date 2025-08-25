// models/Certificate.js
const mongoose = require("mongoose");

// Skill verification schema for certificates
const skillVerificationSchema = new mongoose.Schema(
  {
    skillName: {
      type: String,
      required: true,
    },

    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert", "master"],
      required: true,
    },

    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },

    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
    },

    assessmentDate: {
      type: Date,
      required: true,
    },

    validUntil: {
      type: Date,
      default: null, // null means no expiration
    },

    verificationMethod: {
      type: String,
      enum: [
        "assessment",
        "project",
        "peer_review",
        "instructor_review",
        "portfolio",
      ],
      default: "assessment",
    },
  },
  { _id: true }
);

// Blockchain integration schema
const blockchainSchema = new mongoose.Schema(
  {
    isBlockchainEnabled: {
      type: Boolean,
      default: false,
    },

    network: {
      type: String,
      enum: ["ethereum", "polygon", "binance", "solana", "cardano"],
      default: null,
    },

    contractAddress: {
      type: String,
      default: null,
    },

    tokenId: {
      type: String,
      default: null,
    },

    transactionHash: {
      type: String,
      default: null,
    },

    blockNumber: {
      type: Number,
      default: null,
    },

    mintedAt: {
      type: Date,
      default: null,
    },

    metadataUri: {
      type: String,
      default: null,
    },

    nftImageUrl: {
      type: String,
      default: null,
    },

    gasUsed: {
      type: Number,
      default: null,
    },

    mintingCost: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

// Achievement requirements schema
const achievementRequirementsSchema = new mongoose.Schema(
  {
    // Path completion requirements
    requiredPaths: [
      {
        pathId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "LearningPath",
          required: true,
        },
        minimumScore: {
          type: Number,
          default: 80,
          min: 0,
          max: 100,
        },
        mustComplete: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Assessment requirements
    requiredAssessments: [
      {
        assessmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Assessment",
          required: true,
        },
        minimumScore: {
          type: Number,
          default: 80,
          min: 0,
          max: 100,
        },
        maxAttempts: {
          type: Number,
          default: null, // null means unlimited
        },
      },
    ],

    // Skill level requirements
    requiredSkills: [
      {
        skillName: String,
        minimumLevel: {
          type: String,
          enum: ["beginner", "intermediate", "advanced", "expert", "master"],
        },
        minimumScore: Number,
      },
    ],

    // Time-based requirements
    timeRequirements: {
      minimumLearningHours: {
        type: Number,
        default: 0,
      },
      completionDeadline: {
        type: Date,
        default: null,
      },
      mustMaintainStreak: {
        type: Number,
        default: 0, // days
      },
    },

    // Additional criteria
    additionalCriteria: [
      {
        criterion: String,
        description: String,
        required: Boolean,
        verificationMethod: {
          type: String,
          enum: ["automatic", "manual", "peer_review", "portfolio"],
        },
      },
    ],
  },
  { _id: false }
);

// Main Certificate schema
const certificateSchema = new mongoose.Schema(
  {
    // Certificate identification
    certificateId: {
      type: String,
      required: true,
      unique: true
    },

    title: {
      type: String,
      required: [true, "Certificate title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      required: [true, "Certificate description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    // Certificate type and category
    type: {
      type: String,
      enum: [
        "completion",
        "mastery",
        "specialization",
        "certification",
        "achievement",
        "micro_credential",
        "professional",
        "expert",
      ],
      required: true,
    },

    category: {
      type: String,
      enum: [
        "Communication & Leadership",
        "Innovation & Creativity",
        "Technical Skills",
        "Business Strategy",
        "Personal Development",
        "Data & Analytics",
        "General",
      ],
      required: true,
    },

    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert", "master"],
      required: true,
    },

    // Recipient information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipientName: {
      type: String,
      required: true,
    },

    recipientEmail: {
      type: String,
      required: true,
    },

    // Issuing information
    issuedBy: {
      organization: {
        type: String,
        default: "Sokol Learning Platform",
      },
      issuerName: {
        type: String,
        default: null,
      },
      issuerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      digitalSignature: {
        type: String,
        default: null,
      },
    },

    // Issue and validity dates
    issueDate: {
      type: Date,
      default: Date.now,
    },

    validFrom: {
      type: Date,
      default: Date.now,
    },

    validUntil: {
      type: Date,
      default: null, // null means never expires
    },

    // Requirements and verification
    requirements: achievementRequirementsSchema,

    skillsVerified: [skillVerificationSchema],

    // Achievement data
    achievementData: {
      finalScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true,
      },

      totalTimeSpent: {
        type: Number, // hours
        required: true,
      },

      completionDate: {
        type: Date,
        required: true,
      },

      pathsCompleted: [
        {
          pathId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LearningPath",
          },
          title: String,
          completionDate: Date,
          finalScore: Number,
        },
      ],

      assessmentsPassed: [
        {
          assessmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assessment",
          },
          title: String,
          score: Number,
          attempts: Number,
          passedDate: Date,
        },
      ],

      additionalAchievements: [
        {
          achievement: String,
          evidence: String,
          verifiedBy: String,
          verificationDate: Date,
        },
      ],
    },

    // Visual design and branding
    design: {
      templateId: {
        type: String,
        default: "default",
      },

      backgroundColor: {
        type: String,
        default: "#ffffff",
      },

      primaryColor: {
        type: String,
        default: "#0066cc",
      },

      secondaryColor: {
        type: String,
        default: "#f0f8ff",
      },

      logo: {
        type: String,
        default: null,
      },

      backgroundImage: {
        type: String,
        default: null,
      },

      customCss: {
        type: String,
        default: null,
      },
    },

    // Digital assets
    assets: {
      certificateImageUrl: {
        type: String,
        default: null,
      },

      pdfUrl: {
        type: String,
        default: null,
      },

      badgeImageUrl: {
        type: String,
        default: null,
      },

      qrCodeUrl: {
        type: String,
        default: null,
      },

      nftImageUrl: {
        type: String,
        default: null,
      },
    },

    // Blockchain integration
    blockchain: blockchainSchema,

    // Verification and security
    verification: {
      verificationCode: {
        type: String,
        required: true,
        unique: true
      },

      digitalFingerprint: {
        type: String,
        required: true,
      },

      isVerified: {
        type: Boolean,
        default: true,
      },

      verificationUrl: {
        type: String,
        required: true,
      },

      securityHash: {
        type: String,
        required: true,
      },
    },

    // Sharing and privacy
    sharing: {
      isPublic: {
        type: Boolean,
        default: false,
      },

      allowSharing: {
        type: Boolean,
        default: true,
      },

      socialMediaShared: [
        {
          platform: String,
          sharedAt: Date,
          postId: String,
        },
      ],

      downloadCount: {
        type: Number,
        default: 0,
      },

      viewCount: {
        type: Number,
        default: 0,
      },
    },

    // Status and lifecycle
    status: {
      type: String,
      enum: ["draft", "issued", "revoked", "expired", "renewed"],
      default: "issued",
    },

    revocationReason: {
      type: String,
      default: null,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Metadata and tags
    tags: [String],

    metadata: {
      credentialType: String,
      industryRecognition: [String],
      competencyFramework: String,
      version: {
        type: String,
        default: "1.0.0",
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for performance and lookups
certificateSchema.index({ userId: 1, issueDate: -1 });
// Unique index for certificateId is declared at field level
// Unique index for verification.verificationCode is declared at field level
certificateSchema.index({ status: 1, type: 1 });
certificateSchema.index({ category: 1, level: 1 });
certificateSchema.index({ validUntil: 1 }, { sparse: true });
certificateSchema.index({ tags: 1 });

// Virtual for expiration status
certificateSchema.virtual("isExpired").get(function () {
  if (!this.validUntil) return false;
  return new Date() > this.validUntil;
});

// Virtual for validity status
certificateSchema.virtual("isValid").get(function () {
  return (
    this.status === "issued" && this.verification.isVerified && !this.isExpired
  );
});

// Virtual for public verification URL
certificateSchema.virtual("publicVerificationUrl").get(function () {
  return `${
    process.env.FRONTEND_URL || "https://app.sokol.ai"
  }/certificates/verify/${this.verification.verificationCode}`;
});

// Instance methods

// Generate verification assets (QR code, etc.)
certificateSchema.methods.generateVerificationAssets = async function () {
  const QRCode = require("qrcode"); // Will need to add this dependency

  try {
    // Generate QR code for verification
    const qrCodeDataUrl = await QRCode.toDataURL(this.publicVerificationUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    this.assets.qrCodeUrl = qrCodeDataUrl;
    return this.save();
  } catch (error) {
    console.error("Error generating verification assets:", error);
    throw error;
  }
};

// Revoke certificate
certificateSchema.methods.revoke = function (reason, revokedBy) {
  this.status = "revoked";
  this.revocationReason = reason;
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  this.verification.isVerified = false;

  return this.save();
};

// Renew certificate
certificateSchema.methods.renew = function (newValidUntil = null) {
  this.status = "renewed";
  this.validFrom = new Date();
  this.validUntil = newValidUntil;
  this.verification.isVerified = true;

  return this.save();
};

// Track sharing activity
certificateSchema.methods.trackShare = function (platform, postId = null) {
  this.sharing.socialMediaShared.push({
    platform,
    sharedAt: new Date(),
    postId,
  });

  return this.save();
};

// Track view/download
certificateSchema.methods.trackAccess = function (type = "view") {
  if (type === "download") {
    this.sharing.downloadCount += 1;
  } else {
    this.sharing.viewCount += 1;
  }

  return this.save();
};

// Get certificate summary for display
certificateSchema.methods.getSummary = function () {
  return {
    id: this._id,
    certificateId: this.certificateId,
    title: this.title,
    type: this.type,
    category: this.category,
    level: this.level,
    recipientName: this.recipientName,
    issueDate: this.issueDate,
    status: this.status,
    isValid: this.isValid,
    isExpired: this.isExpired,
    finalScore: this.achievementData.finalScore,
    skillsCount: this.skillsVerified.length,
    verificationUrl: this.publicVerificationUrl,
    assets: this.assets,
  };
};

// Check if user meets requirements for this certificate
certificateSchema.methods.checkUserEligibility = async function (userId) {
  const User = require("./User");
  const UserProgress = require("./UserProgress");
  const AssessmentSession = require("./AssessmentSession");

  const user = await User.findById(userId);
  if (!user) return { eligible: false, reasons: ["User not found"] };

  const reasons = [];
  let eligible = true;

  // Check path requirements
  for (const pathReq of this.requirements.requiredPaths) {
    const progress = await UserProgress.findOne({
      userId,
      pathId: pathReq.pathId,
      "progress.completed": true,
    });

    if (!progress) {
      eligible = false;
      reasons.push(`Path not completed: ${pathReq.pathId}`);
    } else if (progress.performance.averageScore < pathReq.minimumScore) {
      eligible = false;
      reasons.push(
        `Path score too low: ${progress.performance.averageScore} < ${pathReq.minimumScore}`
      );
    }
  }

  // Check assessment requirements
  for (const assessReq of this.requirements.requiredAssessments) {
    const bestAttempt = await AssessmentSession.findBestAttempt(
      userId,
      assessReq.assessmentId
    );

    if (!bestAttempt || !bestAttempt.results.passed) {
      eligible = false;
      reasons.push(`Assessment not passed: ${assessReq.assessmentId}`);
    } else if (bestAttempt.results.finalScore < assessReq.minimumScore) {
      eligible = false;
      reasons.push(
        `Assessment score too low: ${bestAttempt.results.finalScore} < ${assessReq.minimumScore}`
      );
    }
  }

  // Check time requirements
  if (this.requirements.timeRequirements.minimumLearningHours > 0) {
    const totalHours = (user.statistics.totalLearningTime || 0) / 60; // convert minutes to hours
    if (totalHours < this.requirements.timeRequirements.minimumLearningHours) {
      eligible = false;
      reasons.push(
        `Insufficient learning hours: ${totalHours} < ${this.requirements.timeRequirements.minimumLearningHours}`
      );
    }
  }

  return { eligible, reasons };
};

// Static methods

// Find user's certificates
certificateSchema.statics.findUserCertificates = function (
  userId,
  options = {}
) {
  const query = { userId };

  if (options.type) query.type = options.type;
  if (options.category) query.category = options.category;
  if (options.status) query.status = options.status;
  if (options.isValid !== undefined) {
    // Complex query for validity
    query.status = "issued";
    query["verification.isVerified"] = true;
    if (options.isValid) {
      query.$or = [{ validUntil: null }, { validUntil: { $gt: new Date() } }];
    }
  }

  return this.find(query).sort({ issueDate: -1 }).lean();
};

// Verify certificate by verification code
certificateSchema.statics.verifyByCode = function (verificationCode) {
  return this.findOne({
    "verification.verificationCode": verificationCode,
    "verification.isVerified": true,
    status: "issued",
  }).populate("userId", "firstName lastName email");
};

// Get certificate statistics
certificateSchema.statics.getCertificateStats = function (timeRange = "30d") {
  const dateThreshold = new Date();
  switch (timeRange) {
    case "7d":
      dateThreshold.setDate(dateThreshold.getDate() - 7);
      break;
    case "30d":
      dateThreshold.setDate(dateThreshold.getDate() - 30);
      break;
    case "90d":
      dateThreshold.setDate(dateThreshold.getDate() - 90);
      break;
    case "1y":
      dateThreshold.setFullYear(dateThreshold.getFullYear() - 1);
      break;
  }

  return this.aggregate([
    {
      $match: {
        issueDate: { $gte: dateThreshold },
      },
    },
    {
      $group: {
        _id: null,
        totalIssued: { $sum: 1 },
        byType: {
          $push: {
            type: "$type",
            category: "$category",
            level: "$level",
          },
        },
        avgScore: { $avg: "$achievementData.finalScore" },
        totalHours: { $sum: "$achievementData.totalTimeSpent" },
      },
    },
  ]);
};

// Find certificates expiring soon
certificateSchema.statics.findExpiringCertificates = function (
  daysBefore = 30
) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysBefore);

  return this.find({
    status: "issued",
    validUntil: {
      $gte: new Date(),
      $lte: thresholdDate,
    },
  }).populate("userId", "firstName lastName email");
};

// Generate unique certificate ID
certificateSchema.statics.generateCertificateId = function () {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 8);
  return `CERT-${timestamp}-${random}`.toUpperCase();
};

// Generate unique verification code
certificateSchema.statics.generateVerificationCode = function () {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Pre-save middleware to generate IDs and codes
certificateSchema.pre("save", function (next) {
  if (this.isNew) {
    if (!this.certificateId) {
      this.certificateId = this.constructor.generateCertificateId();
    }

    if (!this.verification.verificationCode) {
      this.verification.verificationCode =
        this.constructor.generateVerificationCode();
    }

    if (!this.verification.verificationUrl) {
      this.verification.verificationUrl = this.publicVerificationUrl;
    }

    if (!this.verification.digitalFingerprint) {
      const crypto = require("crypto");
      const fingerprint = crypto
        .createHash("sha256")
        .update(`${this.certificateId}-${this.userId}-${this.issueDate}`)
        .digest("hex");
      this.verification.digitalFingerprint = fingerprint;
    }

    if (!this.verification.securityHash) {
      const crypto = require("crypto");
      const hash = crypto
        .createHash("sha256")
        .update(
          `${this.verification.verificationCode}-${this.verification.digitalFingerprint}`
        )
        .digest("hex");
      this.verification.securityHash = hash;
    }
  }

  next();
});

const Certificate = mongoose.model("Certificate", certificateSchema);

module.exports = Certificate;
