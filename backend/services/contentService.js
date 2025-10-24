const LearningModule = require('../models/LearningModule');
// const LearningPath = require('../models/LearningPath'); // ❌ Removed - deleted by user
const UserProgress = require('../models/UserProgress');
const User = require('../models/User');

// Content adaptation service for personalized learning experiences
class ContentService {
  
  /**
   * Adapt module content based on user's learning style and performance
   */
  static async adaptModuleContent(moduleId, userId) {
    try {
      const [module, user, userProgress] = await Promise.all([
        LearningModule.findById(moduleId),
        User.findById(userId),
        UserProgress.findOne({ userId, moduleId }),
      ]);

      if (!module || !user) {
        throw new Error('Module or user not found');
      }

      const learningStyle = user.learningProfile.learningStyle;
      const userPerformance = this.calculateUserPerformance(userProgress);

      // Get base adapted content
      const adaptedContent = module.getAdaptedContent(learningStyle, userPerformance);

      // Apply additional adaptations based on user progress
      const enhancedContent = await this.enhanceContentWithAI(
        adaptedContent, 
        user, 
        userProgress,
        module,
      );

      return enhancedContent;

    } catch (error) {
      console.error('Content adaptation error:', error);
      throw error;
    }
  }

  /**
   * Calculate user performance metrics for content adaptation
   */
  static calculateUserPerformance(userProgress) {
    if (!userProgress) {
      return {
        averageScore: 0,
        engagementScore: 50,
        timeSpentRatio: 1,
        strugglingAreas: [],
        strengths: [],
      };
    }

    return {
      averageScore: userProgress.performance.averageScore || 0,
      engagementScore: userProgress.analytics.engagementScore || 50,
      timeSpentRatio: userProgress.analytics.totalTimeSpent / 
        Math.max(userProgress.goals?.dailyTimeGoal || 30, 1),
      strugglingAreas: userProgress.performance.weaknesses || [],
      strengths: userProgress.performance.strengths || [],
    };
  }

  /**
   * Enhance content with AI-driven adaptations
   */
  static async enhanceContentWithAI(content, user, userProgress, module) {
    const adaptations = [];

    // Learning style adaptations
    adaptations.push(...this.applyLearningStyleAdaptations(
      content, 
      user.learningProfile.learningStyle,
    ));

    // Difficulty adaptations
    if (userProgress) {
      adaptations.push(...this.applyDifficultyAdaptations(
        content, 
        userProgress.performance,
      ));
    }

    // Pacing adaptations
    adaptations.push(...this.applyPacingAdaptations(
      content, 
      user.learningProfile.preferredPace,
    ));

    // Engagement adaptations
    if (userProgress && userProgress.analytics.engagementScore < 60) {
      adaptations.push(...this.applyEngagementBoostAdaptations(content));
    }

    return {
      ...content,
      adaptations,
      personalizedFor: user.learningProfile.learningStyle,
      difficultyAdjusted: this.calculateAdjustedDifficulty(module.difficulty, userProgress),
    };
  }

  /**
   * Apply learning style specific adaptations
   */
  static applyLearningStyleAdaptations(content, learningStyle) {
    const adaptations = [];

    switch (learningStyle) {
    case 'visual':
      adaptations.push({
        type: 'visual_enhancement',
        description: 'Added visual diagrams and infographics',
        priority: 'high',
        modifications: [
          'Enhanced visual materials priority',
          'Added mind maps and flowcharts',
          'Increased image-to-text ratio',
        ],
      });
      break;

    case 'auditory':
      adaptations.push({
        type: 'auditory_enhancement',
        description: 'Enhanced audio content and verbal explanations',
        priority: 'high',
        modifications: [
          'Prioritized audio materials',
          'Added narration to visual content',
          'Included discussion prompts',
        ],
      });
      break;

    case 'kinesthetic':
      adaptations.push({
        type: 'interactive_enhancement',
        description: 'Added hands-on activities and simulations',
        priority: 'high',
        modifications: [
          'Increased interactive elements',
          'Added practical exercises',
          'Included drag-and-drop activities',
        ],
      });
      break;

    case 'reading':
      adaptations.push({
        type: 'textual_enhancement',
        description: 'Enhanced text-based learning materials',
        priority: 'high',
        modifications: [
          'Detailed written explanations',
          'Added reading materials',
          'Structured note-taking templates',
        ],
      });
      break;

    case 'balanced':
      adaptations.push({
        type: 'multimodal_approach',
        description: 'Balanced mix of all learning modalities',
        priority: 'medium',
        modifications: [
          'Equal emphasis on all content types',
          'Flexible progression paths',
          'User choice in content format',
        ],
      });
      break;
    }

    return adaptations;
  }

  /**
   * Apply difficulty-based adaptations
   */
  static applyDifficultyAdaptations(content, performance) {
    const adaptations = [];
    const averageScore = performance.averageScore || 0;

    if (averageScore < 60) {
      // User is struggling - simplify content
      adaptations.push({
        type: 'difficulty_reduction',
        description: 'Simplified content due to performance indicators',
        priority: 'high',
        modifications: [
          'Added foundational review materials',
          'Broken complex concepts into smaller chunks',
          'Increased examples and practice opportunities',
          'Added step-by-step guides',
        ],
      });
    } else if (averageScore > 90) {
      // User is excelling - add advanced content
      adaptations.push({
        type: 'advanced_content',
        description: 'Added challenging content for high performers',
        priority: 'medium',
        modifications: [
          'Included advanced topics',
          'Added complex problem scenarios',
          'Provided extension activities',
          'Suggested additional resources',
        ],
      });
    }

    return adaptations;
  }

  /**
   * Apply pacing adaptations
   */
  static applyPacingAdaptations(content, preferredPace) {
    const adaptations = [];

    switch (preferredPace) {
    case 'slow':
      adaptations.push({
        type: 'pacing_slow',
        description: 'Adjusted for thoughtful, deliberate learning pace',
        priority: 'medium',
        modifications: [
          'Added reflection questions',
          'Included summary checkpoints',
          'Extended practice opportunities',
          'Built-in review sessions',
        ],
      });
      break;

    case 'fast':
      adaptations.push({
        type: 'pacing_fast',
        description: 'Optimized for accelerated learning',
        priority: 'medium',
        modifications: [
          'Condensed core concepts',
          'Skip-ahead options available',
          'Challenge-based progression',
          'Parallel learning tracks',
        ],
      });
      break;

    case 'medium':
    default:
      adaptations.push({
        type: 'pacing_balanced',
        description: 'Standard pacing with flexibility options',
        priority: 'low',
        modifications: [
          'Balanced content delivery',
          'Optional deep-dive sections',
          'Flexible time recommendations',
        ],
      });
      break;
    }

    return adaptations;
  }

  /**
   * Apply engagement boost adaptations for low engagement users
   */
  static applyEngagementBoostAdaptations(content) {
    return [{
      type: 'engagement_boost',
      description: 'Enhanced interactivity to improve engagement',
      priority: 'high',
      modifications: [
        'Added gamification elements',
        'Increased interactive checkpoints',
        'Included multimedia variety',
        'Added progress celebrations',
        'Implemented micro-learning chunks',
      ],
    }];
  }

  /**
   * Calculate adjusted difficulty based on user performance
   */
  static calculateAdjustedDifficulty(baseDifficulty, userProgress) {
    if (!userProgress) return baseDifficulty;

    const performanceScore = userProgress.performance.averageScore || 0;
    const difficultyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const baseIndex = difficultyLevels.indexOf(baseDifficulty);

    let adjustedIndex = baseIndex;

    if (performanceScore < 50) {
      // Lower difficulty
      adjustedIndex = Math.max(0, baseIndex - 1);
    } else if (performanceScore > 85) {
      // Raise difficulty
      adjustedIndex = Math.min(difficultyLevels.length - 1, baseIndex + 1);
    }

    return difficultyLevels[adjustedIndex];
  }

  /**
   * Get personalized learning path recommendations
   */
  static async getPersonalizedRecommendations(userId, limit = 10) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Get user's learning history
      const userProgress = await UserProgress.find({ userId })
        .populate('pathId', 'category skills difficulty')
        .lean();

      // Build user preference profile
      const userProfile = this.buildUserProfile(user, userProgress);

      // Get recommended paths
      const recommendations = await LearningPath.getRecommendations(userProfile, limit);

      // Score and sort recommendations
      const scoredRecommendations = recommendations.map(path => ({
        path: path.toObject(),
        score: this.calculateRecommendationScore(path, userProfile),
        reasons: this.generateRecommendationReasons(path, userProfile),
      }));

      return scoredRecommendations.sort((a, b) => b.score - a.score);

    } catch (error) {
      console.error('Recommendation generation error:', error);
      throw error;
    }
  }

  /**
   * Build comprehensive user profile for recommendations
   */
  static buildUserProfile(user, userProgress) {
    // Extract completed categories and skills
    const completedCategories = userProgress
      .filter(p => p.progress.completed && p.pathId)
      .map(p => p.pathId.category)
      .filter(Boolean);

    const completedSkills = userProgress
      .filter(p => p.progress.completed && p.pathId)
      .flatMap(p => p.pathId.skills || []);

    // Calculate preferred difficulty
    const avgPerformance = userProgress.length > 0 
      ? userProgress.reduce((sum, p) => sum + (p.performance.averageScore || 0), 0) / userProgress.length
      : 50;

    let preferredDifficulty = 'intermediate';
    if (avgPerformance > 80) preferredDifficulty = 'advanced';
    else if (avgPerformance < 40) preferredDifficulty = 'beginner';

    return {
      learningStyle: user.learningProfile.learningStyle,
      preferredPace: user.learningProfile.preferredPace,
      aiPersonality: user.learningProfile.aiPersonality,
      completedCategories: [...new Set(completedCategories)],
      completedSkills: [...new Set(completedSkills)],
      preferredDifficulty,
      avgPerformance,
      totalLearningTime: user.statistics.totalLearningTime,
      pathsCompleted: user.statistics.pathsCompleted,
    };
  }

  /**
   * Calculate recommendation score for a path
   */
  static calculateRecommendationScore(path, userProfile) {
    let score = 0;

    // Base rating (30% weight)
    score += (path.metadata.rating / 5) * 30;

    // Category interest (25% weight)
    if (userProfile.completedCategories.includes(path.category)) {
      score += 25;
    }

    // Difficulty match (20% weight)
    if (path.difficulty === userProfile.preferredDifficulty) {
      score += 20;
    } else if (Math.abs(['beginner', 'intermediate', 'advanced', 'expert'].indexOf(path.difficulty) - 
                       ['beginner', 'intermediate', 'advanced', 'expert'].indexOf(userProfile.preferredDifficulty)) === 1) {
      score += 10; // Adjacent difficulty levels
    }

    // Skills match (15% weight)
    const skillOverlap = path.skills.filter(skill => 
      userProfile.completedSkills.some(userSkill => 
        skill.toLowerCase().includes(userSkill.toLowerCase()) ||
        userSkill.toLowerCase().includes(skill.toLowerCase()),
      ),
    ).length;
    
    score += Math.min(15, skillOverlap * 5);

    // Popularity factor (10% weight)
    score += Math.min(10, (path.metadata.studentsEnrolled / 1000) * 10);

    return Math.round(score);
  }

  /**
   * Generate human-readable recommendation reasons
   */
  static generateRecommendationReasons(path, userProfile) {
    const reasons = [];

    // Category match
    if (userProfile.completedCategories.includes(path.category)) {
      reasons.push(`Matches your interest in ${path.category}`);
    }

    // Skill building
    const newSkills = path.skills.filter(skill => 
      !userProfile.completedSkills.includes(skill),
    );
    if (newSkills.length > 0) {
      reasons.push(`Builds new skills: ${newSkills.slice(0, 2).join(', ')}`);
    }

    // Difficulty appropriateness
    if (path.difficulty === userProfile.preferredDifficulty) {
      reasons.push('Perfect difficulty level for your current skills');
    }

    // High rating
    if (path.metadata.rating >= 4.5) {
      reasons.push(`Highly rated (${path.metadata.rating}/5)`);
    }

    // Popular choice
    if (path.metadata.studentsEnrolled > 1000) {
      reasons.push(`Popular choice with ${path.metadata.studentsEnrolled}+ students`);
    }

    return reasons;
  }

  /**
   * Generate dynamic content variations based on user interaction
   */
  static async generateContentVariations(moduleId, userId, interactionHistory) {
    try {
      const module = await LearningModule.findById(moduleId);
      if (!module) throw new Error('Module not found');

      const variations = {
        simplified: null,
        detailed: null,
        practical: null,
        theoretical: null,
      };

      // Analyze interaction patterns
      const patterns = this.analyzeInteractionPatterns(interactionHistory);

      // Generate variations based on patterns
      if (patterns.needsSimplification) {
        variations.simplified = this.generateSimplifiedContent(module);
      }

      if (patterns.wantsMoreDetail) {
        variations.detailed = this.generateDetailedContent(module);
      }

      if (patterns.prefersPractical) {
        variations.practical = this.generatePracticalContent(module);
      }

      if (patterns.prefersTheory) {
        variations.theoretical = this.generateTheoreticalContent(module);
      }

      return variations;

    } catch (error) {
      console.error('Content variation generation error:', error);
      throw error;
    }
  }

  /**
   * Analyze user interaction patterns to inform content generation
   */
  static analyzeInteractionPatterns(interactionHistory) {
    if (!interactionHistory || interactionHistory.length === 0) {
      return {
        needsSimplification: false,
        wantsMoreDetail: false,
        prefersPractical: false,
        prefersTheory: false,
      };
    }

    const patterns = {
      needsSimplification: false,
      wantsMoreDetail: false,
      prefersPractical: false,
      prefersTheory: false,
    };

    // Analyze patterns (simplified logic)
    const repeatViews = interactionHistory.filter(i => i.type === 'content_replay').length;
    const helpRequests = interactionHistory.filter(i => i.type === 'help_request').length;
    const practicalInteractions = interactionHistory.filter(i => 
      i.materialType === 'interactive' || i.materialType === 'practice',
    ).length;

    patterns.needsSimplification = repeatViews > 2 || helpRequests > 1;
    patterns.prefersPractical = practicalInteractions > interactionHistory.length * 0.6;
    patterns.wantsMoreDetail = interactionHistory.some(i => 
      i.completionPercentage === 100 && i.timeSpent > i.estimatedTime * 1.5,
    );

    return patterns;
  }

  /**
   * Generate simplified content version
   */
  static generateSimplifiedContent(module) {
    return {
      type: 'simplified',
      description: 'Simplified version with basic concepts and step-by-step guidance',
      modifications: [
        'Reduced complexity',
        'Added basic examples',
        'Step-by-step breakdowns',
        'Glossary of terms',
      ],
    };
  }

  /**
   * Generate detailed content version
   */
  static generateDetailedContent(module) {
    return {
      type: 'detailed',
      description: 'Comprehensive version with in-depth explanations and additional resources',
      modifications: [
        'Extended explanations',
        'Additional case studies',
        'Advanced examples',
        'Supplementary readings',
      ],
    };
  }

  /**
   * Generate practical content version
   */
  static generatePracticalContent(module) {
    return {
      type: 'practical',
      description: 'Hands-on version emphasizing real-world application',
      modifications: [
        'Interactive exercises',
        'Real-world scenarios',
        'Practical projects',
        'Skill demonstrations',
      ],
    };
  }

  /**
   * Generate theoretical content version
   */
  static generateTheoreticalContent(module) {
    return {
      type: 'theoretical',
      description: 'Conceptual version focusing on underlying principles and theory',
      modifications: [
        'Theoretical foundations',
        'Academic perspectives',
        'Research findings',
        'Conceptual frameworks',
      ],
    };
  }
}

module.exports = ContentService;