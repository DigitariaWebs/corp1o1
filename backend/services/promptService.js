// services/promptService.js
const AIPrompt = require("../models/AIPrompt");
const { AppError } = require("../middleware/errorHandler");

class PromptService {
  constructor() {
    // Cache for frequently used prompts
    this.promptCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes

    // Context type mapping for intent detection
    this.intentContextMap = {
      help: "learning_help",
      motivation: "motivation",
      assessment: "assessment_feedback",
      progress: "progress_review",
      explanation: "concept_explanation",
      guidance: "skill_guidance",
      encouragement: "encouragement",
      challenge: "challenge",
      reflection: "reflection",
      goal_setting: "goal_setting",
      general: "learning_help", // default fallback
    };
  }

  /**
   * Select optimal prompt based on context and user state
   * @param {string} personality - AI personality (ARIA, SAGE, COACH)
   * @param {string} intent - User message intent
   * @param {Object} userContext - Complete user context from contextService
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Selected and contextualized prompt
   */
  async selectOptimalPrompt(personality, intent, userContext, options = {}) {
    try {
      console.log(`🎯 Selecting prompt: ${personality} | Intent: ${intent}`);

      // Map intent to context type
      const contextType = this.intentContextMap[intent] || "learning_help";

      // Build selection criteria
      const selectionCriteria = this.buildSelectionCriteria(
        personality,
        contextType,
        userContext,
        options
      );

      // Get best matching prompt from database
      const promptTemplate = await this.getBestPrompt(selectionCriteria);

      // Build contextualized prompt
      const contextualizedPrompt = await this.buildContextualizedPrompt(
        promptTemplate,
        userContext,
        options
      );

      // Apply adaptation rules
      const adaptedPrompt = await this.applyAdaptationRules(
        contextualizedPrompt,
        userContext
      );

      // Record usage for optimization
      await this.recordPromptUsage(promptTemplate._id, adaptedPrompt.metadata);

      console.log(`✅ Prompt selected: ${promptTemplate.name}`);
      return adaptedPrompt;
    } catch (error) {
      console.error("❌ Error selecting prompt:", error);

      // Fallback to basic prompt if database fails
      return this.getFallbackPrompt(personality, intent, userContext);
    }
  }

  /**
   * Build selection criteria for prompt matching
   * @param {string} personality - AI personality
   * @param {string} contextType - Context type
   * @param {Object} userContext - User context
   * @param {Object} options - Additional options
   * @returns {Object} Selection criteria
   */
  buildSelectionCriteria(personality, contextType, userContext, options) {
    const criteria = {
      personality,
      contextType,
      isActive: true,
    };

    // Add learning domain if available
    if (userContext.currentLearning?.currentPath?.category) {
      criteria.learningDomains =
        userContext.currentLearning.currentPath.category;
    }

    // Add difficulty targeting
    if (userContext.currentLearning?.currentPath?.difficulty) {
      criteria.targetDifficulty = {
        $in: ["any", userContext.currentLearning.currentPath.difficulty],
      };
    }

    // Add user state considerations
    const userState = userContext.insights?.userState;
    if (userState === "struggling") {
      criteria.adaptationRules = {
        $elemMatch: {
          triggerCondition: "user_struggling",
        },
      };
    }

    return criteria;
  }

  /**
   * Get best prompt from database with caching
   * @param {Object} criteria - Selection criteria
   * @returns {Promise<Object>} Best matching prompt
   */
  async getBestPrompt(criteria) {
    // Generate cache key
    const cacheKey = JSON.stringify(criteria);

    // Check cache first
    const cached = this.promptCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log("📋 Using cached prompt");
      return cached.prompt;
    }

    // Query database for best prompt
    const prompt = await AIPrompt.getBestPrompt(
      criteria.personality,
      criteria.contextType,
      {
        learningDomain: criteria.learningDomains,
        difficulty: criteria.targetDifficulty?.$in?.[1],
        enableABTesting: true,
      }
    );

    if (!prompt) {
      throw new AppError(
        `No prompt found for ${criteria.personality} - ${criteria.contextType}`,
        404
      );
    }

    // Cache the result
    this.promptCache.set(cacheKey, {
      prompt,
      timestamp: Date.now(),
    });

    return prompt;
  }

  /**
   * Build contextualized prompt with variable substitution
   * @param {Object} promptTemplate - Database prompt template
   * @param {Object} userContext - User context
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Contextualized prompt
   */
  async buildContextualizedPrompt(promptTemplate, userContext, options = {}) {
    console.log(`🔧 Building contextualized prompt: ${promptTemplate.name}`);

    // Use the prompt's built-in method to build contextualized version
    const contextualizedPrompt =
      promptTemplate.buildContextualizedPrompt(userContext);

    // Add user message to the prompt structure
    const userMessage =
      options.userMessage || "Hello, I need help with my learning.";

    // Construct final messages array for OpenAI
    const messages = [
      {
        role: "system",
        content: contextualizedPrompt.systemPrompt,
      },
      {
        role: "user",
        content: this.enhanceUserMessage(
          contextualizedPrompt.userPrompt,
          userMessage
        ),
      },
    ];

    return {
      messages,
      config: {
        ...promptTemplate.responseConfig.toObject(),
        model: promptTemplate.modelType || "gpt-4",
      },
      metadata: {
        promptId: promptTemplate._id,
        promptName: promptTemplate.name,
        personality: promptTemplate.personality,
        contextType: promptTemplate.contextType,
        adaptationsApplied: contextualizedPrompt.adaptationsApplied || [],
        contextVariablesUsed: promptTemplate.contextVariables.map(
          (cv) => cv.name
        ),
        buildTimestamp: new Date(),
      },
    };
  }

  /**
   * Enhance user message with context
   * @param {string} userPromptTemplate - Template user prompt
   * @param {string} actualUserMessage - Actual user message
   * @returns {string} Enhanced user message
   */
  enhanceUserMessage(userPromptTemplate, actualUserMessage) {
    // If template has {{userQuestion}} placeholder, replace it
    if (userPromptTemplate.includes("{{userQuestion}}")) {
      return userPromptTemplate.replace(
        /\{\{userQuestion\}\}/g,
        actualUserMessage
      );
    }

    // Otherwise, append the user message to the template
    return `${userPromptTemplate}\n\nUser's message: "${actualUserMessage}"`;
  }

  /**
   * Apply adaptation rules based on user context
   * @param {Object} prompt - Contextualized prompt
   * @param {Object} userContext - User context
   * @returns {Promise<Object>} Adapted prompt
   */
  async applyAdaptationRules(prompt, userContext) {
    console.log("🎛️ Applying adaptation rules");

    const adaptations = [];
    const systemMessage = prompt.messages[0];

    // Apply context-driven adaptations
    const userState = userContext.insights?.userState;
    const motivationLevel = userContext.insights?.motivationLevel || 50;
    const strugglingAreas = userContext.performance?.strugglingAreas || [];

    // Struggling user adaptations
    if (userState === "struggling" || strugglingAreas.length > 2) {
      systemMessage.content +=
        "\n\nADAPTATION: The user is currently struggling. Provide extra encouragement, break down concepts into smaller steps, and offer specific, actionable guidance. Be patient and supportive.";
      adaptations.push("struggling_support");
    }

    // Low motivation adaptations
    if (motivationLevel < 40) {
      systemMessage.content +=
        "\n\nADAPTATION: The user has low motivation. Focus on inspiring them, highlighting their progress, and connecting learning to their personal goals. Be enthusiastic and encouraging.";
      adaptations.push("motivation_boost");
    }

    // High engagement adaptations
    if (userState === "highly_engaged" && motivationLevel > 80) {
      systemMessage.content +=
        "\n\nADAPTATION: The user is highly engaged and motivated. Provide advanced challenges, deeper insights, and encourage them to push their boundaries. Be intellectually stimulating.";
      adaptations.push("advanced_challenge");
    }

    // Learning style adaptations
    const learningStyle = userContext.user?.learningStyle;
    if (learningStyle) {
      const styleAdaptations =
        this.getLearningStyalseAdaptations(learningStyle);
      systemMessage.content += `\n\nLEARNING STYLE ADAPTATION: ${styleAdaptations}`;
      adaptations.push(`learning_style_${learningStyle}`);
    }

    // Time-based adaptations
    const preferredHours = userContext.patterns?.preferredLearningHours;
    if (preferredHours && preferredHours.length > 0) {
      const currentHour = new Date().getHours();
      if (!preferredHours.includes(currentHour)) {
        systemMessage.content +=
          "\n\nTIMING ADAPTATION: The user is learning outside their typical hours. Be mindful that they might be less focused or energetic than usual.";
        adaptations.push("off_peak_timing");
      }
    }

    // Update metadata
    prompt.metadata.adaptationsApplied = [
      ...prompt.metadata.adaptationsApplied,
      ...adaptations,
    ];

    return prompt;
  }

  /**
   * Get learning style specific adaptations
   * @param {string} learningStyle - User's learning style
   * @returns {string} Style-specific guidance
   */
  getLearningStyalseAdaptations(learningStyle) {
    const adaptations = {
      visual:
        "Use descriptive language, mention diagrams/charts, suggest visualizing concepts, and offer to describe visual representations of ideas.",
      auditory:
        "Explain concepts verbally, use analogies and stories, suggest discussion or verbal repetition, and emphasize listening-based learning methods.",
      kinesthetic:
        "Focus on hands-on activities, practical applications, real-world examples, and encourage active practice and experimentation.",
      reading:
        "Provide detailed written explanations, suggest reading materials, organize information in structured text format, and emphasize note-taking.",
    };

    return adaptations[learningStyle] || adaptations["visual"];
  }

  /**
   * Record prompt usage for optimization
   * @param {string} promptId - Prompt ID
   * @param {Object} metadata - Usage metadata
   * @returns {Promise<void>}
   */
  async recordPromptUsage(promptId, metadata) {
    try {
      const prompt = await AIPrompt.findById(promptId);
      if (prompt) {
        await prompt.recordUsage(
          metadata.responseTime || 0,
          metadata.userRating || null
        );
      }
    } catch (error) {
      console.error("Error recording prompt usage:", error);
      // Don't throw - this is just for optimization
    }
  }

  /**
   * Get fallback prompt when database fails
   * @param {string} personality - AI personality
   * @param {string} intent - User intent
   * @param {Object} userContext - User context
   * @returns {Object} Fallback prompt
   */
  getFallbackPrompt(personality, intent, userContext) {
    console.log("🆘 Using fallback prompt");

    const personalityPrompts = {
      ARIA: {
        system: `You are ARIA, an encouraging and supportive AI learning assistant. You provide helpful guidance while being warm, empathetic, and motivating. The user's learning style is ${
          userContext.user?.learningStyle || "visual"
        } and they prefer a ${
          userContext.user?.preferredPace || "moderate"
        } learning pace.`,
        user: "The user needs help with their learning journey. Provide encouraging and practical assistance.",
      },
      SAGE: {
        system: `You are SAGE, a professional and knowledgeable AI learning analyst. You provide objective, detailed analysis and recommendations. The user's learning style is ${
          userContext.user?.learningStyle || "visual"
        } and they prefer a ${
          userContext.user?.preferredPace || "moderate"
        } learning pace.`,
        user: "The user is seeking professional guidance and analysis of their learning progress.",
      },
      COACH: {
        system: `You are COACH, a motivational AI learning coach. You provide energetic encouragement, challenges, and goal-oriented guidance. The user's learning style is ${
          userContext.user?.learningStyle || "visual"
        } and they prefer a ${
          userContext.user?.preferredPace || "moderate"
        } learning pace.`,
        user: "The user needs motivational coaching and guidance to achieve their learning goals.",
      },
    };

    const promptData =
      personalityPrompts[personality] || personalityPrompts["ARIA"];

    return {
      messages: [
        { role: "system", content: promptData.system },
        { role: "user", content: promptData.user },
      ],
      config: {
        model: "gpt-4",
        temperature: 0.7,
        maxTokens: 500,
      },
      metadata: {
        promptId: "fallback",
        promptName: `Fallback ${personality} Prompt`,
        personality,
        contextType: "learning_help",
        isFallback: true,
        buildTimestamp: new Date(),
      },
    };
  }

  /**
   * Analyze user message to determine intent
   * @param {string} message - User message
   * @returns {string} Detected intent
   */
  analyzeMessageIntent(message) {
    const lowerMessage = message.toLowerCase();

    // Intent patterns
    const patterns = {
      help: [
        "help",
        "assistance",
        "stuck",
        "confused",
        "don't understand",
        "explain",
      ],
      motivation: [
        "motivated",
        "inspire",
        "encourage",
        "give up",
        "tired",
        "bored",
      ],
      assessment: [
        "test",
        "quiz",
        "assessment",
        "evaluate",
        "score",
        "performance",
      ],
      progress: [
        "progress",
        "how am i doing",
        "status",
        "achievement",
        "completion",
      ],
      explanation: [
        "what is",
        "how does",
        "why",
        "explain",
        "definition",
        "meaning",
      ],
      guidance: [
        "what should",
        "recommend",
        "suggest",
        "advice",
        "next step",
        "how to",
      ],
      encouragement: [
        "difficult",
        "hard",
        "challenging",
        "frustrated",
        "struggling",
      ],
      challenge: ["easy", "bored", "more advanced", "harder", "challenge me"],
      reflection: [
        "learned",
        "think about",
        "reflect",
        "understand",
        "realize",
      ],
      goal_setting: [
        "goal",
        "objective",
        "aim",
        "target",
        "want to achieve",
        "plan",
      ],
    };

    // Find best matching intent
    let bestIntent = "general";
    let maxMatches = 0;

    for (const [intent, keywords] of Object.entries(patterns)) {
      const matches = keywords.filter((keyword) =>
        lowerMessage.includes(keyword)
      ).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestIntent = intent;
      }
    }

    console.log(`🔍 Intent detected: ${bestIntent} (${maxMatches} matches)`);
    return bestIntent;
  }

  /**
   * Get prompt effectiveness analytics
   * @param {string} personality - AI personality (optional)
   * @param {string} contextType - Context type (optional)
   * @returns {Promise<Object>} Analytics data
   */
  async getPromptAnalytics(personality = null, contextType = null) {
    const query = { isActive: true };
    if (personality) query.personality = personality;
    if (contextType) query.contextType = contextType;

    const prompts = await AIPrompt.find(query).lean();

    const analytics = {
      totalPrompts: prompts.length,
      averageRating: 0,
      averageUseCount: 0,
      topPerformingPrompts: [],
      bottomPerformingPrompts: [],
      usageDistribution: {},
    };

    if (prompts.length === 0) return analytics;

    // Calculate averages
    analytics.averageRating =
      prompts.reduce(
        (sum, p) => sum + (p.performanceMetrics?.averageRating || 0),
        0
      ) / prompts.length;

    analytics.averageUseCount =
      prompts.reduce(
        (sum, p) => sum + (p.performanceMetrics?.useCount || 0),
        0
      ) / prompts.length;

    // Sort by performance
    const sortedByPerformance = prompts.sort(
      (a, b) =>
        (b.performanceMetrics?.effectivenessScore || 0) -
        (a.performanceMetrics?.effectivenessScore || 0)
    );

    analytics.topPerformingPrompts = sortedByPerformance
      .slice(0, 5)
      .map((p) => ({
        name: p.name,
        personality: p.personality,
        contextType: p.contextType,
        effectivenessScore: p.performanceMetrics?.effectivenessScore || 0,
        useCount: p.performanceMetrics?.useCount || 0,
        averageRating: p.performanceMetrics?.averageRating || 0,
      }));

    analytics.bottomPerformingPrompts = sortedByPerformance
      .slice(-3)
      .map((p) => ({
        name: p.name,
        personality: p.personality,
        contextType: p.contextType,
        effectivenessScore: p.performanceMetrics?.effectivenessScore || 0,
        useCount: p.performanceMetrics?.useCount || 0,
        averageRating: p.performanceMetrics?.averageRating || 0,
      }));

    // Usage distribution by personality
    analytics.usageDistribution = prompts.reduce((dist, p) => {
      const key = p.personality;
      if (!dist[key]) dist[key] = 0;
      dist[key] += p.performanceMetrics?.useCount || 0;
      return dist;
    }, {});

    return analytics;
  }

  /**
   * Clear prompt cache
   */
  clearCache() {
    this.promptCache.clear();
    console.log("🗑️ Prompt cache cleared");
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.promptCache.size,
      timeout: this.cacheTimeout,
      keys: Array.from(this.promptCache.keys()).slice(0, 5), // First 5 keys
    };
  }
}

// Export singleton instance
const promptService = new PromptService();

module.exports = {
  promptService,
  PromptService,
};
