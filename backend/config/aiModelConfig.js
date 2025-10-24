// config/aiModelConfig.js
/**
 * Centralized AI Model Configuration
 * All AI model references should use these constants instead of hardcoded strings
 */

const AI_MODELS = {
  // Primary models
  DEFAULT: process.env.OPENAI_MODEL || 'o3-deep-research',
  CONVERSATION: process.env.OPENAI_MODEL_CONVERSATION || 'o3-deep-research',
  ASSESSMENT: process.env.OPENAI_MODEL_ASSESSMENT || 'gpt-4o',
  EVALUATION: process.env.OPENAI_MODEL_EVALUATION || 'gpt-4o',
  ANALYSIS: process.env.OPENAI_MODEL_ANALYSIS || 'gpt-4o',
  
  // Fallback models
  FALLBACK: 'gpt-5',
  LIGHTWEIGHT: 'gpt-3.5-turbo',
  
  // Legacy models (for backward compatibility)
  GPT4: 'gpt-4o',
  GPT4_MINI: 'gpt-4o-mini',
  GPT35: 'gpt-3.5-turbo',
  GPT35_16K: 'gpt-3.5-turbo-16k',
  
  // Specialized models
  O3_DEEP_RESEARCH: 'o3-deep-research',
  GPT4_TURBO: 'gpt-4-turbo-preview',
};

// Model type mappings for session configuration
const MODEL_TYPES = {
  OPENAI_GPT4: 'openai-gpt4',
  OPENAI_GPT35: 'openai-gpt35',
  OPENAI_O3_DEEP_RESEARCH: 'openai-o3-deep-research',
  CLAUDE: 'claude',
  LOCAL: 'local',
};

// Model configurations for different use cases
const MODEL_CONFIGS = {
  conversation: {
    model: AI_MODELS.CONVERSATION,
    temperature: 0.7,
    maxTokens: 4000,
    purpose: 'Comprehensive conversational responses',
  },
  assessment: {
    model: AI_MODELS.ASSESSMENT,
    temperature: 0.5,
    maxTokens: 6000,
    purpose: 'Complex assessment and question generation',
  },
  evaluation: {
    model: AI_MODELS.EVALUATION,
    temperature: 0.2,
    maxTokens: 2000,
    purpose: 'Accurate evaluation and grading',
  },
  analysis: {
    model: AI_MODELS.ANALYSIS,
    temperature: 0.4,
    maxTokens: 3000,
    purpose: 'Comprehensive data analysis and insights',
  },
  lightweight: {
    model: AI_MODELS.LIGHTWEIGHT,
    temperature: 0.7,
    maxTokens: 2000,
    purpose: 'Quick responses and simple tasks',
  },
};

// Helper functions
const getModelForUseCase = (useCase) => {
  return MODEL_CONFIGS[useCase]?.model || AI_MODELS.DEFAULT;
};

const getModelConfig = (useCase) => {
  return MODEL_CONFIGS[useCase] || MODEL_CONFIGS.conversation;
};

const isModelAvailable = (model) => {
  return Object.values(AI_MODELS).includes(model);
};

const getModelType = (model) => {
  if (model === AI_MODELS.O3_DEEP_RESEARCH) return MODEL_TYPES.OPENAI_O3_DEEP_RESEARCH;
  if (model === AI_MODELS.GPT4 || model === AI_MODELS.GPT4_MINI) return MODEL_TYPES.OPENAI_GPT4;
  if (model === AI_MODELS.GPT35 || model === AI_MODELS.GPT35_16K) return MODEL_TYPES.OPENAI_GPT35;
  return MODEL_TYPES.OPENAI_GPT4; // default
};

module.exports = {
  AI_MODELS,
  MODEL_TYPES,
  MODEL_CONFIGS,
  getModelForUseCase,
  getModelConfig,
  isModelAvailable,
  getModelType,
};
