const mongoose = require('mongoose');

// Context variables schema for dynamic prompt building
const contextVariableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['user_profile', 'learning_progress', 'session_data', 'module_content', 'performance_data'],
    required: true
  },
  description: String,
  required: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Response configuration schema
const responseConfigSchema = new mongoose.Schema({
  maxTokens: {
    type: Number,
    default: 500,
    min: 50,
    max: 2000
  },
  temperature: {
    type: Number,
    default: 0.7,
    min: 0,
    max: 2
  },
  topP: {
    type: Number,
    default: 1,
    min: 0,
    max: 1
  },
  frequencyPenalty: {
    type: Number,
    default: 0,
    min: -2,
    max: 2
  },
  presencePenalty: {
    type: Number,
    default: 0,
    min: -2,
    max: 2
  }
}, { _id: false });

// Adaptation rules for dynamic prompt modification
const adaptationRuleSchema = new mongoose.Schema({
  triggerCondition: {
    type: String,
    enum: [
      'user_struggling', 'user_excelling', 'low_engagement', 'high_engagement',
      'first_session', 'assessment_failed', 'assessment_passed',
      'learning_style_mismatch', 'time_pressure', 'help_requested'
    ],
    required: true
  },
  conditionValue: {
    type: mongoose.Schema.Types.Mixed, // Can be number, string, boolean
    default: null
  },
  modification: {
    type: String,
    enum: [
      'simplify_language', 'add_examples', 'increase_encouragement',
      'add_challenges', 'provide_hints', 'break_down_steps',
      'add_motivation', 'adjust_tone', 'add_resources'
    ],
    required: true
  },
  modificationText: {
    type: String,
    required: true
  },
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  }
}, { _id: true });

// AI Prompt schema
const aiPromptSchema = new mongoose.Schema({
  // Basic prompt information
  name: {
    type: String,
    required: [true, 'Prompt name is required'],
    trim: true,
    maxlength: [100, 'Prompt name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Prompt description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // AI model and personality configuration
  modelType: {
    type: String,
    enum: ['openai-gpt4', 'openai-gpt35', 'claude', 'local'],
    default: 'openai-gpt4'
  },
  
  personality: {
    type: String,
    enum: ['ARIA', 'SAGE', 'COACH'],
    required: [true, 'AI personality is required']
  },
  
  // Context and usage
  contextType: {
    type: String,
    enum: [
      'learning_help', 'motivation', 'assessment_feedback', 'progress_review',
      'module_introduction', 'concept_explanation', 'skill_guidance',
      'encouragement', 'challenge', 'reflection', 'goal_setting'
    ],
    required: [true, 'Context type is required']
  },
  
  // Prompt template structure
  systemPrompt: {
    type: String,
    required: [true, 'System prompt is required'],
    maxlength: [2000, 'System prompt cannot exceed 2000 characters']
  },
  
  userPromptTemplate: {
    type: String,
    required: [true, 'User prompt template is required'],
    maxlength: [1000, 'User prompt template cannot exceed 1000 characters']
  },
  
  // Dynamic context variables
  contextVariables: [contextVariableSchema],
  
  // Response configuration
  responseConfig: {
    type: responseConfigSchema,
    default: () => ({})
  },
  
  // Adaptation rules for dynamic modification
  adaptationRules: [adaptationRuleSchema],
  
  // Usage and performance tracking
  performanceMetrics: {
    useCount: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0
    },
    effectivenessScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageResponseTime: {
      type: Number,
      default: 0 // in milliseconds
    },
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Version and status management
  version: {
    type: String,
    default: '1.0.0'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isDefault: {
    type: Boolean,
    default: false
  },
  
  // Learning domain and difficulty
  learningDomains: [{
    type: String,
    enum: [
      'Communication & Leadership', 'Innovation & Creativity', 'Technical Skills',
      'Business Strategy', 'Personal Development', 'Data & Analytics'
    ]
  }],
  
  targetDifficulty: {
    type: String,
    enum: ['any', 'beginner', 'intermediate', 'advanced', 'expert'],
    default: 'any'
  },
  
  // A/B testing support
  testGroup: {
    type: String,
    default: 'default'
  },
  
  testWeight: {
    type: Number,
    default: 1,
    min: 0,
    max: 1
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance optimization
aiPromptSchema.index({ personality: 1, contextType: 1, isActive: 1 });
aiPromptSchema.index({ modelType: 1, isActive: 1 });
aiPromptSchema.index({ learningDomains: 1, targetDifficulty: 1 });
aiPromptSchema.index({ 'performanceMetrics.effectivenessScore': -1 });
aiPromptSchema.index({ testGroup: 1, testWeight: 1 });

// Virtual for overall performance score
aiPromptSchema.virtual('overallPerformance').get(function() {
  const rating = this.performanceMetrics.averageRating || 0;
  const effectiveness = this.performanceMetrics.effectivenessScore || 0;
  const successRate = this.performanceMetrics.successRate || 0;
  
  return Math.round(
    (rating / 5) * 30 + 
    (effectiveness / 100) * 40 + 
    (successRate / 100) * 30
  );
});

// Instance method to build contextualized prompt
aiPromptSchema.methods.buildContextualizedPrompt = function(context = {}) {
  let systemPrompt = this.systemPrompt;
  let userPrompt = this.userPromptTemplate;
  
  // Apply context variables
  this.contextVariables.forEach(variable => {
    const placeholder = `{{${variable.name}}}`;
    const value = this.getContextValue(context, variable);
    
    systemPrompt = systemPrompt.replace(new RegExp(placeholder, 'g'), value);
    userPrompt = userPrompt.replace(new RegExp(placeholder, 'g'), value);
  });
  
  // Apply adaptation rules if applicable
  const adaptations = this.getApplicableAdaptations(context);
  if (adaptations.length > 0) {
    systemPrompt += '\n\nAdditional Instructions:\n' + 
      adaptations.map(rule => rule.modificationText).join('\n');
  }
  
  return {
    systemPrompt,
    userPrompt,
    config: this.responseConfig,
    adaptationsApplied: adaptations.map(rule => rule.modification)
  };
};

// Helper method to extract context value
aiPromptSchema.methods.getContextValue = function(context, variable) {
  const { name, type } = variable;
  
  switch (type) {
    case 'user_profile':
      return context.user?.[name] || `[${name}]`;
    case 'learning_progress':
      return context.progress?.[name] || `[${name}]`;
    case 'session_data':
      return context.session?.[name] || `[${name}]`;
    case 'module_content':
      return context.module?.[name] || `[${name}]`;
    case 'performance_data':
      return context.performance?.[name] || `[${name}]`;
    default:
      return `[${name}]`;
  }
};

// Helper method to get applicable adaptations
aiPromptSchema.methods.getApplicableAdaptations = function(context) {
  return this.adaptationRules
    .filter(rule => this.checkAdaptationCondition(rule, context))
    .sort((a, b) => b.priority - a.priority);
};

// Helper method to check adaptation condition
aiPromptSchema.methods.checkAdaptationCondition = function(rule, context) {
  const { triggerCondition, conditionValue } = rule;
  
  switch (triggerCondition) {
    case 'user_struggling':
      return context.performance?.averageScore < (conditionValue || 60);
    case 'user_excelling':
      return context.performance?.averageScore > (conditionValue || 90);
    case 'low_engagement':
      return context.session?.engagementScore < (conditionValue || 50);
    case 'high_engagement':
      return context.session?.engagementScore > (conditionValue || 85);
    case 'first_session':
      return context.progress?.sessionCount === 1;
    case 'assessment_failed':
      return context.performance?.lastAssessmentScore < (conditionValue || 70);
    case 'assessment_passed':
      return context.performance?.lastAssessmentScore >= (conditionValue || 70);
    case 'help_requested':
      return context.session?.helpRequestCount > 0;
    default:
      return false;
  }
};

// Instance method to record usage and update metrics
aiPromptSchema.methods.recordUsage = async function(responseTime, userRating = null) {
  this.performanceMetrics.useCount += 1;
  
  if (responseTime > 0) {
    const currentTotal = this.performanceMetrics.averageResponseTime * 
      (this.performanceMetrics.useCount - 1);
    this.performanceMetrics.averageResponseTime = 
      (currentTotal + responseTime) / this.performanceMetrics.useCount;
  }
  
  if (userRating !== null && userRating >= 1 && userRating <= 5) {
    const currentTotal = this.performanceMetrics.averageRating * 
      this.performanceMetrics.ratingCount;
    this.performanceMetrics.ratingCount += 1;
    this.performanceMetrics.averageRating = 
      (currentTotal + userRating) / this.performanceMetrics.ratingCount;
  }
  
  return this.save();
};

// Static method to get best prompt for context
aiPromptSchema.statics.getBestPrompt = async function(personality, contextType, options = {}) {
  const query = {
    personality,
    contextType,
    isActive: true
  };
  
  if (options.learningDomain) {
    query.learningDomains = options.learningDomain;
  }
  
  if (options.difficulty) {
    query.$or = [
      { targetDifficulty: 'any' },
      { targetDifficulty: options.difficulty }
    ];
  }
  
  // Get prompts sorted by performance
  const prompts = await this.find(query)
    .sort({ 
      'performanceMetrics.effectivenessScore': -1,
      'performanceMetrics.averageRating': -1 
    })
    .limit(5);
  
  if (prompts.length === 0) {
    throw new Error(`No prompts found for ${personality} - ${contextType}`);
  }
  
  // A/B testing: weighted selection
  if (prompts.length > 1 && options.enableABTesting !== false) {
    const totalWeight = prompts.reduce((sum, prompt) => sum + prompt.testWeight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const prompt of prompts) {
      currentWeight += prompt.testWeight;
      if (random <= currentWeight) {
        return prompt;
      }
    }
  }
  
  return prompts[0];
};

// Static method to create default prompts
aiPromptSchema.statics.createDefaults = async function() {
  const defaultPrompts = [
    {
      name: "ARIA Learning Help",
      description: "Encouraging learning assistance from ARIA",
      personality: "ARIA",
      contextType: "learning_help",
      systemPrompt: "You are ARIA, an encouraging AI learning assistant. You provide helpful, supportive guidance while adapting to the user's learning style ({{learningStyle}}) and current progress ({{progressPercentage}}%).",
      userPromptTemplate: "The user needs help with: {{userQuestion}}. Their current module is '{{moduleTitle}}' and they've been struggling with {{strugglingAreas}}. Provide encouraging, practical help.",
      contextVariables: [
        { name: "learningStyle", type: "user_profile", description: "User's learning style" },
        { name: "progressPercentage", type: "learning_progress", description: "Current progress percentage" },
        { name: "userQuestion", type: "session_data", description: "User's question or concern" },
        { name: "moduleTitle", type: "module_content", description: "Current module title" },
        { name: "strugglingAreas", type: "performance_data", description: "Areas where user is struggling" }
      ],
      isDefault: true
    },
    {
      name: "SAGE Progress Review",
      description: "Professional progress analysis from SAGE",
      personality: "SAGE",
      contextType: "progress_review",
      systemPrompt: "You are SAGE, a professional AI learning analyst. Provide detailed, objective analysis of learning progress for users with {{totalLearningTime}} minutes of study time.",
      userPromptTemplate: "Analyze the user's progress: {{progressPercentage}}% complete, {{assessmentScores}} assessment scores, {{engagementLevel}} engagement. Provide professional insights and recommendations.",
      contextVariables: [
        { name: "totalLearningTime", type: "learning_progress", description: "Total learning time" },
        { name: "progressPercentage", type: "learning_progress", description: "Overall progress" },
        { name: "assessmentScores", type: "performance_data", description: "Recent assessment scores" },
        { name: "engagementLevel", type: "session_data", description: "User engagement level" }
      ],
      isDefault: true
    }
  ];
  
  for (const promptData of defaultPrompts) {
    const existing = await this.findOne({
      personality: promptData.personality,
      contextType: promptData.contextType,
      isDefault: true
    });
    
    if (!existing) {
      await this.create(promptData);
    }
  }
};

const AIPrompt = mongoose.model('AIPrompt', aiPromptSchema);

module.exports = AIPrompt;