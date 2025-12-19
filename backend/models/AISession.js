const mongoose = require('mongoose');

// Message schema for conversation history
const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    // Note: unique constraint removed - cannot use unique on subdocument arrays
    // Uniqueness is enforced at application level in addMessage method
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: [4000, 'Message content cannot exceed 4000 characters'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  // Metadata about the message
  metadata: {
    responseTime: {
      type: Number, // milliseconds
      default: 0,
    },
    tokenCount: {
      type: Number,
      default: 0,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    intent: {
      type: String,
      enum: ['help', 'motivation', 'clarification', 'assessment', 'general', 'feedback'],
      default: 'general',
    },
    topics: [{
      type: String,
      trim: true,
    }],
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    // User feedback on AI response
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      helpful: {
        type: Boolean,
        default: null,
      },
      comment: {
        type: String,
        maxlength: 500,
      },
      timestamp: Date,
    },
    // Error information if message failed
    error: {
      occurred: {
        type: Boolean,
        default: false,
      },
      message: String,
      code: String,
      timestamp: Date,
    },
  },
}, { _id: true });

// Session context schema
const sessionContextSchema = new mongoose.Schema({
  // Current learning context
  currentModule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningModule',
    default: null,
  },
  currentPath: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath',
    default: null,
  },
  learningSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningSession',
    default: null,
  },
  
  // Session characteristics
  sessionDuration: {
    type: Number, // minutes since session start
    default: 0,
  },
  userState: {
    type: String,
    enum: ['focused', 'struggling', 'motivated', 'fatigued', 'confused', 'engaged'],
    default: 'focused',
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  
  // Learning progress context
  progressContext: {
    currentProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    recentPerformance: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    strugglingAreas: [String],
    strengths: [String],
    lastAssessmentScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
  },
  
  // Environmental context
  deviceType: {
    type: String,
    enum: ['desktop', 'tablet', 'mobile', 'unknown'],
    default: 'unknown',
  },
  platform: String,
  timezone: String,
}, { _id: false });

// Conversation analytics schema
const conversationAnalyticsSchema = new mongoose.Schema({
  // Message statistics
  totalMessages: {
    type: Number,
    default: 0,
  },
  userMessages: {
    type: Number,
    default: 0,
  },
  assistantMessages: {
    type: Number,
    default: 0,
  },
  
  // Response quality metrics
  averageResponseTime: {
    type: Number, // milliseconds
    default: 0,
  },
  averageConfidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  
  // Engagement metrics
  engagementScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  helpfulnessScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  
  // Topic analysis
  topicsDiscussed: [String],
  mostCommonIntent: String,
  
  // Adaptation tracking
  adaptationsApplied: [{
    type: String,
    timestamp: Date,
    effectiveness: Number,
  }],
}, { _id: false });

// AI Session schema
const aiSessionSchema = new mongoose.Schema({
  // Session identification
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  
  // User and AI configuration
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  
  aiPersonality: {
    type: String,
    default: 'ASSISTANT',
  },
  
  // Conversation type for prompt selection
  conversationType: {
    type: String,
    enum: ['LEARNING', 'EDUCATION', 'PROBLEM_SOLVING', 'PROGRAMMING', 'MATHEMATICS', 'GENERAL'],
    default: 'GENERAL',
  },
  
  // Conversation title
  title: {
    type: String,
    default: 'New Conversation',
    maxlength: [100, 'Title cannot exceed 100 characters'],
    trim: true,
  },
  
  // Session timing
  startTime: {
    type: Date,
    default: Date.now,
  },
  
  endTime: {
    type: Date,
    default: null,
  },
  
  lastInteraction: {
    type: Date,
    default: Date.now,
  },
  
  // Session status
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'timeout', 'error'],
    default: 'active',
  },
  
  // Complete conversation history
  messages: [messageSchema],
  
  // Dynamic session context
  context: sessionContextSchema,
  
  // Session analytics and metrics
  analytics: conversationAnalyticsSchema,
  
  // Session configuration
  configuration: {
    modelType: {
      type: String,
      enum: ['openai-gpt4', 'openai-gpt35', 'openai-o3-deep-research', 'claude', 'local'],
      default: 'openai-o3-deep-research',
    },
    maxMessages: {
      type: Number,
      default: 100,
    },
    sessionTimeout: {
      type: Number, // minutes
      default: 30,
    },
    adaptiveMode: {
      type: Boolean,
      default: true,
    },
    contextAware: {
      type: Boolean,
      default: true,
    },
  },
  
  // Session outcomes and summary
  outcomes: {
    problemsSolved: {
      type: Number,
      default: 0,
    },
    conceptsClarified: [String],
    recommendationsGiven: [String],
    userSatisfaction: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    sessionNotes: String,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes for performance optimization
aiSessionSchema.index({ userId: 1, startTime: -1 });
// Unique index for sessionId is declared at field level
aiSessionSchema.index({ status: 1, lastInteraction: -1 });
aiSessionSchema.index({ 'context.currentModule': 1 });
aiSessionSchema.index({ 'context.currentPath': 1 });

// Virtual for session duration
aiSessionSchema.virtual('duration').get(function() {
  const end = this.endTime || new Date();
  return Math.round((end - this.startTime) / (1000 * 60)); // minutes
});

// Virtual for conversation length
aiSessionSchema.virtual('conversationLength').get(function() {
  return this.messages.length;
});

// Pre-save middleware to update analytics
aiSessionSchema.pre('save', function(next) {
  this.updateAnalytics();
  this.lastInteraction = new Date();
  next();
});

// Instance method to update analytics
aiSessionSchema.methods.updateAnalytics = function() {
  const userMessages = this.messages.filter(m => m.role === 'user');
  const assistantMessages = this.messages.filter(m => m.role === 'assistant');
  
  // Initialize analytics if it doesn't exist
  if (!this.analytics) {
    this.analytics = {
      totalMessages: 0,
      userMessages: 0,
      assistantMessages: 0,
      averageResponseTime: 0,
      averageConfidence: 0,
      averageRating: 0,
      totalTokens: 0,
      averageTokensPerMessage: 0,
      sessionDuration: 0,
      engagementScore: 0,
      learningProgress: 0,
      retentionRate: 0,
      adaptationEffectiveness: 0,
      personalizationScore: 0,
      contextRelevance: 0,
      sessionQuality: 0,
    };
  }
  
  this.analytics.totalMessages = this.messages.length;
  this.analytics.userMessages = userMessages.length;
  this.analytics.assistantMessages = assistantMessages.length;
  
  // Calculate average response time
  if (assistantMessages.length > 0) {
    const totalResponseTime = assistantMessages.reduce((sum, msg) => 
      sum + (msg.metadata.responseTime || 0), 0);
    this.analytics.averageResponseTime = totalResponseTime / assistantMessages.length;
  }
  
  // Calculate average confidence
  if (assistantMessages.length > 0) {
    const totalConfidence = assistantMessages.reduce((sum, msg) => 
      sum + (msg.metadata.confidence || 0), 0);
    this.analytics.averageConfidence = totalConfidence / assistantMessages.length;
  }
  
  // Calculate average rating from feedback
  const ratedMessages = assistantMessages.filter(m => m.metadata.feedback?.rating);
  if (ratedMessages.length > 0) {
    const totalRating = ratedMessages.reduce((sum, msg) => 
      sum + msg.metadata.feedback.rating, 0);
    this.analytics.averageRating = totalRating / ratedMessages.length;
  }
  
  // Extract topics discussed
  this.analytics.topicsDiscussed = [
    ...new Set(this.messages.flatMap(m => m.metadata.topics || [])),
  ];
  
  // Find most common intent
  const intents = this.messages.map(m => m.metadata.intent).filter(Boolean);
  const intentCounts = {};
  intents.forEach(intent => {
    intentCounts[intent] = (intentCounts[intent] || 0) + 1;
  });
  this.analytics.mostCommonIntent = Object.keys(intentCounts).reduce((a, b) => 
    intentCounts[a] > intentCounts[b] ? a : b, '');
  
  // Calculate engagement score based on various factors
  const messageFrequency = this.messages.length / Math.max(this.duration, 1);
  const feedbackPositivity = ratedMessages.length > 0 ? 
    ratedMessages.filter(m => m.metadata.feedback.rating >= 4).length / ratedMessages.length : 0.5;
  
  this.analytics.engagementScore = Math.round(
    (messageFrequency * 20) + (feedbackPositivity * 80),
  );
  
  // Calculate helpfulness score
  const helpfulMessages = assistantMessages.filter(m => 
    m.metadata.feedback?.helpful === true,
  );
  this.analytics.helpfulnessScore = assistantMessages.length > 0 ? 
    Math.round((helpfulMessages.length / assistantMessages.length) * 100) : 0;
};

// Instance method to add message to conversation
aiSessionSchema.methods.addMessage = function(role, content, metadata = {}) {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const message = {
    messageId,
    role,
    content: content.substring(0, 4000), // Enforce length limit
    timestamp: new Date(),
    metadata: {
      ...metadata,
      confidence: metadata.confidence || 0,
      intent: metadata.intent || 'general',
      topics: metadata.topics || [],
      urgency: metadata.urgency || 'low',
    },
  };
  
  this.messages.push(message);
  
  // Enforce message limit
  if (this.messages.length > this.configuration.maxMessages) {
    this.messages = this.messages.slice(-this.configuration.maxMessages);
  }
  
  return message;
};

// Instance method to update context
aiSessionSchema.methods.updateContext = function(contextUpdates) {
  this.context = {
    ...(this.context ? this.context.toObject() : {}),
    ...contextUpdates,
    lastActivity: new Date(),
  };
  
  return this;
};

// Instance method to provide feedback on message
aiSessionSchema.methods.addMessageFeedback = function(messageId, feedback) {
  const message = this.messages.find(m => m.messageId === messageId);
  if (message) {
    message.metadata.feedback = {
      ...feedback,
      timestamp: new Date(),
    };
    return true;
  }
  return false;
};

// Instance method to check if session should timeout
aiSessionSchema.methods.shouldTimeout = function() {
  const timeoutMs = this.configuration.sessionTimeout * 60 * 1000;
  return (new Date() - this.lastInteraction) > timeoutMs;
};

// Instance method to end session
aiSessionSchema.methods.endSession = function(reason = 'completed') {
  this.status = reason;
  this.endTime = new Date();
  
  // Calculate final outcomes
  this.outcomes.problemsSolved = this.messages.filter(m => 
    m.role === 'user' && m.content.includes('?'),
  ).length;
  
  this.outcomes.conceptsClarified = this.analytics.topicsDiscussed;
  
  return this.save();
};

// Instance method to get conversation summary
aiSessionSchema.methods.getConversationSummary = function() {
  const recentMessages = this.messages.slice(-10);
  
  return {
    sessionId: this.sessionId,
    duration: this.duration,
    messageCount: this.messages.length,
    personality: this.aiPersonality,
    topics: this.analytics.topicsDiscussed,
    userSatisfaction: this.outcomes.userSatisfaction,
    recentMessages: recentMessages.map(m => ({
      role: m.role,
      content: m.content.substring(0, 100) + '...',
      timestamp: m.timestamp,
    })),
  };
};

// Static method to find active sessions for user
aiSessionSchema.statics.findActiveSessions = function(userId) {
  return this.find({
    userId,
    status: 'active',
    lastInteraction: { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // 30 minutes
  });
};

// Static method to get session analytics for user
aiSessionSchema.statics.getUserSessionAnalytics = function(userId, timeRange = '30d') {
  const dateThreshold = new Date();
  switch (timeRange) {
  case '7d':
    dateThreshold.setDate(dateThreshold.getDate() - 7);
    break;
  case '30d':
    dateThreshold.setDate(dateThreshold.getDate() - 30);
    break;
  case '90d':
    dateThreshold.setDate(dateThreshold.getDate() - 90);
    break;
  }
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        startTime: { $gte: dateThreshold },
      },
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalMessages: { $sum: '$analytics.totalMessages' },
        avgSessionDuration: { $avg: '$duration' },
        avgEngagement: { $avg: '$analytics.engagementScore' },
        avgHelpfulness: { $avg: '$analytics.helpfulnessScore' },
        avgRating: { $avg: '$analytics.averageRating' },
        totalTopics: { $push: '$analytics.topicsDiscussed' },
      },
    },
  ]);
};

// Static method to cleanup old sessions
aiSessionSchema.statics.cleanupOldSessions = async function(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await this.deleteMany({
    startTime: { $lt: cutoffDate },
    status: { $in: ['completed', 'timeout', 'error'] },
  });
  
  return result.deletedCount;
};

const AISession = mongoose.model('AISession', aiSessionSchema);

module.exports = AISession;