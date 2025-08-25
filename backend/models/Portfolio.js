const mongoose = require("mongoose");

// External portfolio connection schema
const externalConnectionSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      enum: ["github", "linkedin", "behance", "dribbble", "website", "codepen", "stackoverflow", "medium"],
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    profileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastSync: {
      type: Date,
      default: null,
    },
    syncStatus: {
      type: String,
      enum: ["pending", "syncing", "success", "error"],
      default: "pending",
    },
    syncError: {
      type: String,
      default: null,
    },
    stats: {
      repositories: { type: Number, default: 0 },
      followers: { type: Number, default: 0 },
      contributions: { type: Number, default: 0 },
      projects: { type: Number, default: 0 },
      connections: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

// Portfolio project schema
const portfolioProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    technologies: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: String,
      required: true,
      enum: ["web", "mobile", "desktop", "data", "design", "research", "writing", "other"],
    },
    status: {
      type: String,
      enum: ["completed", "in_progress", "planned", "archived"],
      default: "completed",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    urls: {
      live: { type: String, default: null },
      github: { type: String, default: null },
      demo: { type: String, default: null },
      case_study: { type: String, default: null },
    },
    images: [
      {
        url: String,
        alt: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    achievements: [
      {
        type: String,
        trim: true,
      },
    ],
    metrics: {
      users: { type: Number, default: 0 },
      downloads: { type: Number, default: 0 },
      stars: { type: Number, default: 0 },
      performance_improvement: { type: String, default: null },
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    externalSource: {
      platform: { type: String, default: null },
      id: { type: String, default: null },
      lastSync: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// Experience/Work schema
const workExperienceSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    achievements: [
      {
        type: String,
        trim: true,
      },
    ],
    technologies: [
      {
        type: String,
        trim: true,
      },
    ],
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    companyLogo: {
      type: String,
      default: null,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Main portfolio schema
const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Basic Info
    headline: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    summary: {
      type: String,
      maxlength: 1000,
    },
    location: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    resume: {
      url: { type: String, default: null },
      lastUpdated: { type: Date, default: null },
    },

    // External Connections
    externalConnections: [externalConnectionSchema],

    // Portfolio Content
    projects: [portfolioProjectSchema],
    workExperience: [workExperienceSchema],

    // Skills & Technologies
    topSkills: [
      {
        name: String,
        level: {
          type: String,
          enum: ["beginner", "intermediate", "advanced", "expert"],
        },
        yearsOfExperience: Number,
        isVerified: { type: Boolean, default: false },
      },
    ],

    // Analytics & Stats
    analytics: {
      views: { type: Number, default: 0 },
      uniqueVisitors: { type: Number, default: 0 },
      lastViewed: { type: Date, default: null },
      viewHistory: [
        {
          date: Date,
          views: Number,
          source: String,
        },
      ],
    },

    // Settings
    settings: {
      isPublic: {
        type: Boolean,
        default: true,
      },
      allowContact: {
        type: Boolean,
        default: true,
      },
      theme: {
        type: String,
        enum: ["default", "minimal", "creative", "professional"],
        default: "default",
      },
      customDomain: {
        type: String,
        default: null,
      },
      seoSettings: {
        title: String,
        description: String,
        keywords: [String],
      },
    },

    // Integration Status
    lastSyncAt: {
      type: Date,
      default: null,
    },
    nextSyncAt: {
      type: Date,
      default: null,
    },
    syncInProgress: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
portfolioSchema.index({ userId: 1 });
portfolioSchema.index({ "settings.isPublic": 1 });
portfolioSchema.index({ "analytics.views": -1 });
portfolioSchema.index({ "projects.category": 1 });
portfolioSchema.index({ "projects.technologies": 1 });
portfolioSchema.index({ "externalConnections.platform": 1 });

// Virtual for portfolio URL
portfolioSchema.virtual("portfolioUrl").get(function () {
  return `${process.env.FRONTEND_URL}/portfolio/${this.userId}`;
});

// Virtual for total projects
portfolioSchema.virtual("totalProjects").get(function () {
  return this.projects.filter((p) => p.isPublic).length;
});

// Virtual for years of experience
portfolioSchema.virtual("yearsOfExperience").get(function () {
  if (!this.workExperience || this.workExperience.length === 0) return 0;
  
  const earliestStart = this.workExperience.reduce((earliest, exp) => {
    return exp.startDate < earliest ? exp.startDate : earliest;
  }, new Date());
  
  return Math.floor((Date.now() - earliestStart.getTime()) / (1000 * 60 * 60 * 24 * 365));
});

// Instance methods
portfolioSchema.methods.incrementViews = function (source = "direct") {
  this.analytics.views += 1;
  this.analytics.lastViewed = new Date();
  
  // Add to view history
  const today = new Date().toISOString().split("T")[0];
  const existingEntry = this.analytics.viewHistory.find(
    (entry) => entry.date.toISOString().split("T")[0] === today
  );
  
  if (existingEntry) {
    existingEntry.views += 1;
  } else {
    this.analytics.viewHistory.push({
      date: new Date(),
      views: 1,
      source,
    });
  }
  
  return this.save();
};

portfolioSchema.methods.addProject = function (projectData) {
  this.projects.push(projectData);
  return this.save();
};

portfolioSchema.methods.syncExternalData = async function () {
  this.syncInProgress = true;
  this.lastSyncAt = new Date();
  
  // TODO: Implement external API integrations
  // This would sync data from GitHub, LinkedIn, etc.
  
  this.syncInProgress = false;
  this.nextSyncAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Next day
  
  return this.save();
};

// Static methods
portfolioSchema.statics.getPublicPortfolios = function (limit = 10) {
  return this.find({ "settings.isPublic": true })
    .populate("userId", "name avatar")
    .sort({ "analytics.views": -1 })
    .limit(limit);
};

portfolioSchema.statics.searchPortfolios = function (query, filters = {}) {
  const searchQuery = {
    "settings.isPublic": true,
    $text: { $search: query },
  };
  
  if (filters.skills) {
    searchQuery["topSkills.name"] = { $in: filters.skills };
  }
  
  if (filters.technologies) {
    searchQuery["projects.technologies"] = { $in: filters.technologies };
  }
  
  return this.find(searchQuery)
    .populate("userId", "name avatar")
    .sort({ score: { $meta: "textScore" } });
};

// Text search index
portfolioSchema.index({
  headline: "text",
  summary: "text",
  "projects.title": "text",
  "projects.description": "text",
  "topSkills.name": "text",
});

const Portfolio = mongoose.model("Portfolio", portfolioSchema);

module.exports = Portfolio;