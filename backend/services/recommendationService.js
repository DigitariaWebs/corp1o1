// services/recommendationService.js
const RecommendationEngine = require("../models/RecommendationEngine");
const LearningAnalytics = require("../models/LearningAnalytics");
const User = require("../models/User");
const UserProgress = require("../models/UserProgress");
const LearningPath = require("../models/LearningPath");
const LearningModule = require("../models/LearningModule");
const { openAIService } = require("./openaiService");
const { analyticsService } = require("./analyticsService");
const { predictionService } = require("./predictionService");

class RecommendationService {
  /**
   * Generate personalized recommendations for user
   */
  async generatePersonalizedRecommendations(userId, context = {}) {
    try {
      const {
        analytics,
        user,
        maxRecommendations = 5,
        includeScheduling = true,
        prioritizeWeakAreas = true,
      } = context;

      const recommendations = [];

      // 1. Content progression recommendations
      const progressionRecs = await this.generateProgressionRecommendations(
        userId,
        analytics
      );
      recommendations.push(...progressionRecs);

      // 2. Skill development recommendations
      if (prioritizeWeakAreas) {
        const skillRecs = await this.generateSkillRecommendations(
          userId,
          analytics
        );
        recommendations.push(...skillRecs);
      }

      // 3. Engagement optimization recommendations
      const engagementRecs = await this.generateEngagementRecommendations(
        userId,
        analytics
      );
      recommendations.push(...engagementRecs);

      // 4. AI interaction optimization
      const aiRecs = await this.generateAIOptimizationRecommendations(
        userId,
        analytics
      );
      recommendations.push(...aiRecs);

      // 5. Schedule optimization recommendations
      if (includeScheduling) {
        const scheduleRecs = await this.generateScheduleRecommendations(
          userId,
          analytics
        );
        recommendations.push(...scheduleRecs);
      }

      // Score and rank recommendations
      const scoredRecommendations = await this.scoreRecommendations(
        recommendations,
        userId,
        analytics
      );

      // Select top recommendations
      const topRecommendations = scoredRecommendations
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, maxRecommendations);

      // Create and save recommendation documents
      const savedRecommendations = [];
      for (const rec of topRecommendations) {
        const recommendation = new RecommendationEngine({
          user: userId,
          ...rec,
          generatedBy: {
            algorithm: "hybrid",
            version: "1.0",
            factors: rec.scoringFactors,
          },
          timing: {
            suggestedTiming: rec.urgency || "this_week",
            validUntil: this.calculateValidUntil(rec.type),
          },
        });

        await recommendation.save();
        savedRecommendations.push(recommendation);
      }

      return savedRecommendations;
    } catch (error) {
      console.error("Error generating personalized recommendations:", error);
      throw error;
    }
  }

  /**
   * Generate progression-based recommendations
   */
  async generateProgressionRecommendations(userId, analytics) {
    const recommendations = [];

    // Get current progress
    const currentProgress = await UserProgress.find({
      user: userId,
      completionStatus: { $in: ["not_started", "in_progress"] },
    }).populate("learningPath learningModule");

    // Recommend continuing current modules
    const inProgress = currentProgress.filter(
      (p) => p.completionStatus === "in_progress"
    );
    if (inProgress.length > 0) {
      const module = inProgress[0].learningModule;
      recommendations.push({
        type: "next_module",
        category: module.category,
        title: `Continue ${module.title}`,
        description: `You're ${inProgress[0].progressPercentage}% through this module. Keep up the momentum!`,
        actionable: {
          primaryAction: "Continue Learning",
          deepLink: `/modules/${module._id}`,
        },
        targeting: {
          targetContent: module._id,
          targetContentType: "LearningModule",
          targetDifficulty: module.difficulty,
        },
        relevanceScore: 95,
        confidenceScore: 90,
        priorityScore: 90,
        urgency: "immediate",
      });
    }

    // Recommend next logical modules
    const nextModules = await this.getRecommendedNextModules(userId);
    for (const moduleRec of nextModules.slice(0, 2)) {
      recommendations.push({
        type: "next_module",
        category: moduleRec.category,
        title: `Ready for ${moduleRec.title}`,
        description: `Based on your progress, this module is a perfect next step`,
        actionable: {
          primaryAction: "Start Module",
          deepLink: `/modules/${moduleRec._id}`,
        },
        targeting: {
          targetContent: moduleRec._id,
          targetContentType: "LearningModule",
          targetDifficulty: moduleRec.difficulty,
        },
        relevanceScore: 85,
        confidenceScore: 80,
        priorityScore: 75,
      });
    }

    return recommendations;
  }

  /**
   * Generate skill development recommendations
   */
  async generateSkillRecommendations(userId, analytics) {
    const recommendations = [];

    // Identify skill gaps
    const skillGaps = await this.identifySkillGaps(userId, analytics);

    for (const gap of skillGaps.slice(0, 2)) {
      // Find modules that address this skill gap
      const relevantModules = await LearningModule.find({
        category: gap.category,
        difficulty: { $lte: gap.recommendedLevel },
        skills: { $in: gap.missingSkills },
      }).limit(3);

      if (relevantModules.length > 0) {
        recommendations.push({
          type: "skill_development",
          category: gap.category,
          title: `Strengthen ${gap.category} Skills`,
          description: `Focus on ${gap.missingSkills.join(
            ", "
          )} to improve your ${gap.category} capabilities`,
          actionable: {
            primaryAction: "Explore Skill Modules",
            deepLink: `/skills/${gap.category.toLowerCase()}`,
          },
          targeting: {
            targetSkills: gap.missingSkills,
            targetDifficulty: gap.recommendedLevel,
          },
          relevanceScore: gap.relevanceScore,
          confidenceScore: gap.confidence,
          priorityScore: gap.priority,
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate engagement optimization recommendations
   */
  async generateEngagementRecommendations(userId, analytics) {
    const recommendations = [];

    // Low engagement detection
    if (analytics.engagement.focusScore < 60) {
      const optimalTime = await this.findOptimalLearningTime(userId);

      recommendations.push({
        type: "schedule_optimization",
        category: "General",
        title: "Optimize Your Learning Schedule",
        description: `Your focus is highest around ${optimalTime.hour}:00 on ${optimalTime.dayName}s. Try scheduling learning sessions then!`,
        actionable: {
          primaryAction: "Update Schedule",
          deepLink: "/profile/schedule",
        },
        relevanceScore: 80,
        confidenceScore: 70,
        priorityScore: 85,
      });
    }

    // Session length optimization
    const avgSessionDuration = analytics.engagement.averageSessionDuration;
    if (avgSessionDuration > 90 || avgSessionDuration < 15) {
      const optimalDuration = avgSessionDuration > 90 ? "shorter" : "longer";
      recommendations.push({
        type: "study_break",
        category: "General",
        title: `Try ${
          optimalDuration === "shorter" ? "Shorter" : "Longer"
        } Learning Sessions`,
        description: `${
          optimalDuration === "shorter"
            ? "Breaking learning into shorter sessions can improve focus and retention"
            : "Longer sessions might help you get into a deeper learning flow"
        }`,
        actionable: {
          primaryAction: "Adjust Session Length",
          deepLink: "/profile/preferences",
        },
        relevanceScore: 75,
        confidenceScore: 65,
        priorityScore: 60,
      });
    }

    return recommendations;
  }

  /**
   * Generate AI optimization recommendations
   */
  async generateAIOptimizationRecommendations(userId, analytics) {
    const recommendations = [];

    // AI satisfaction is low
    if (analytics.aiInteraction.satisfactionScore < 3.5) {
      const user = await User.findById(userId);
      const optimalPersonality = await this.recommendOptimalAIPersonality(
        userId,
        analytics
      );

      if (optimalPersonality !== user.learningProfile.aiPersonality) {
        recommendations.push({
          type: "ai_personality",
          category: "General",
          title: `Try ${optimalPersonality} AI Assistant`,
          description: `Based on your learning style, ${optimalPersonality} might be a better match for you`,
          actionable: {
            primaryAction: "Switch AI Personality",
            deepLink: "/profile/ai-assistant",
          },
          relevanceScore: 70,
          confidenceScore: 60,
          priorityScore: 50,
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate schedule optimization recommendations
   */
  async generateScheduleRecommendations(userId, analytics) {
    const recommendations = [];

    // Inconsistent learning pattern
    if (analytics.engagement.sessionCount < 3) {
      recommendations.push({
        type: "schedule_optimization",
        category: "General",
        title: "Build a Consistent Learning Habit",
        description:
          "Regular, shorter sessions are more effective than sporadic long sessions",
        actionable: {
          primaryAction: "Set Learning Schedule",
          deepLink: "/profile/schedule",
        },
        relevanceScore: 85,
        confidenceScore: 80,
        priorityScore: 75,
      });
    }

    return recommendations;
  }

  /**
   * Handle actions when user accepts a recommendation
   */
  async handleAcceptedRecommendation(recommendation) {
    try {
      // Record that action was taken
      await recommendation.recordActionTaken();

      // Trigger specific actions based on recommendation type
      switch (recommendation.type) {
        case "next_module":
          await this.handleModuleRecommendationAccepted(recommendation);
          break;
        case "schedule_optimization":
          await this.handleScheduleOptimizationAccepted(recommendation);
          break;
        case "ai_personality":
          await this.handleAIPersonalityChangeAccepted(recommendation);
          break;
        case "skill_development":
          await this.handleSkillDevelopmentAccepted(recommendation);
          break;
        default:
          console.log(
            `No specific handler for recommendation type: ${recommendation.type}`
          );
      }

      // Generate follow-up recommendations if appropriate
      await this.generateFollowUpRecommendations(recommendation);
    } catch (error) {
      console.error("Error handling accepted recommendation:", error);
    }
  }

  /**
   * Get personalized next steps for user
   */
  async getPersonalizedNextSteps(userId, options = {}) {
    const { limit = 3, category } = options;

    // Get active recommendations
    const activeRecommendations =
      await RecommendationEngine.getActiveRecommendations(userId, limit * 2);

    // Filter by category if specified
    let filteredRecs = activeRecommendations;
    if (category) {
      filteredRecs = activeRecommendations.filter(
        (rec) => rec.category === category
      );
    }

    // Convert to next steps format
    const nextSteps = filteredRecs.slice(0, limit).map((rec) => ({
      id: rec._id,
      type: rec.type,
      title: rec.title,
      description: rec.description,
      priority: this.getPriorityLevel(rec.priorityScore),
      estimatedTime: this.estimateActionTime(rec),
      action: rec.actionable.primaryAction,
      deepLink: rec.actionable.deepLink,
      relevanceScore: rec.relevanceScore,
    }));

    return nextSteps;
  }

  /**
   * Get content recommendations for specific module
   */
  async getContentRecommendations(userId, moduleId) {
    try {
      const module = await LearningModule.findById(moduleId);
      if (!module) {
        throw new Error("Module not found");
      }

      const user = await User.findById(userId);
      const userProgress = await UserProgress.findOne({
        user: userId,
        learningModule: moduleId,
      });

      const recommendations = [];

      // Difficulty adjustment recommendations
      if (userProgress && userProgress.strugglingAreas.length > 0) {
        recommendations.push({
          type: "review_content",
          title: "Review Challenging Topics",
          description: `Focus on: ${userProgress.strugglingAreas.join(", ")}`,
          relevanceScore: 90,
          action: "review_topics",
        });
      }

      // Learning style adaptations
      const styleAdaptations = this.getStyleAdaptations(
        module,
        user.learningProfile.learningStyle
      );
      recommendations.push(...styleAdaptations);

      // Supplementary resources
      const supplements = await this.getSupplementaryResources(module, user);
      recommendations.push(...supplements);

      return recommendations;
    } catch (error) {
      console.error("Error getting content recommendations:", error);
      throw error;
    }
  }

  /**
   * Get timing recommendations for user
   */
  async getTimingRecommendations(userId) {
    try {
      const analytics = await LearningAnalytics.getLatestAnalytics(userId);

      if (!analytics) {
        return {
          message:
            "Complete more learning activities to get timing recommendations",
          recommendations: [],
        };
      }

      const optimalTime = await this.findOptimalLearningTime(userId);
      const streak = await analyticsService.getLearningStreak(userId);

      const recommendations = {
        optimalLearningTime: {
          hour: optimalTime.hour,
          dayOfWeek: optimalTime.dayOfWeek,
          confidence: optimalTime.confidence,
          suggestion: `Your focus is typically highest around ${optimalTime.hour}:00 on ${optimalTime.dayName}s`,
        },
        sessionRecommendations: {
          idealDuration: this.calculateIdealSessionDuration(analytics),
          breakFrequency: this.calculateOptimalBreakFrequency(analytics),
          weeklyGoal: this.calculateWeeklyGoal(analytics),
        },
        streakOptimization: {
          currentStreak: streak.currentStreak,
          suggestions: this.getStreakOptimizationSuggestions(streak),
        },
      };

      return recommendations;
    } catch (error) {
      console.error("Error getting timing recommendations:", error);
      throw error;
    }
  }

  /**
   * Score recommendations based on multiple factors
   */
  async scoreRecommendations(recommendations, userId, analytics) {
    const scoredRecommendations = [];

    for (const rec of recommendations) {
      // Calculate component scores
      const userContextScore = await this.calculateUserContextScore(
        rec,
        userId,
        analytics
      );
      const timingScore = this.calculateTimingScore(rec);
      const relevanceScore = rec.relevanceScore || 50;
      const confidenceScore = rec.confidenceScore || 50;
      const priorityScore = rec.priorityScore || 50;

      // Weight the scores
      const overallScore = Math.round(
        relevanceScore * 0.3 +
          confidenceScore * 0.2 +
          priorityScore * 0.2 +
          userContextScore * 0.2 +
          timingScore * 0.1
      );

      scoredRecommendations.push({
        ...rec,
        overallScore,
        scoringFactors: [
          { name: "relevance", weight: 0.3, value: relevanceScore },
          { name: "confidence", weight: 0.2, value: confidenceScore },
          { name: "priority", weight: 0.2, value: priorityScore },
          { name: "userContext", weight: 0.2, value: userContextScore },
          { name: "timing", weight: 0.1, value: timingScore },
        ],
      });
    }

    return scoredRecommendations;
  }

  // Helper methods

  async identifySkillGaps(userId, analytics) {
    // Analyze user's progress across different categories to identify gaps
    const progressByCategory = await UserProgress.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "learningmodules",
          localField: "learningModule",
          foreignField: "_id",
          as: "module",
        },
      },
      { $unwind: "$module" },
      {
        $group: {
          _id: "$module.category",
          avgScore: { $avg: "$finalScore" },
          completedCount: {
            $sum: {
              $cond: [{ $eq: ["$completionStatus", "completed"] }, 1, 0],
            },
          },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    const skillGaps = [];
    for (const category of progressByCategory) {
      if (
        category.avgScore < 70 ||
        category.completedCount / category.totalCount < 0.5
      ) {
        skillGaps.push({
          category: category._id,
          currentLevel: this.scoreToLevel(category.avgScore),
          recommendedLevel: "intermediate",
          confidence: 75,
          priority: 100 - category.avgScore,
          relevanceScore: 100 - category.avgScore,
          missingSkills: await this.getMissingSkillsForCategory(
            category._id,
            userId
          ),
        });
      }
    }

    return skillGaps;
  }

  async findOptimalLearningTime(userId) {
    // Analyze user's session history to find optimal times
    const sessions = await LearningSession.find({ user: userId })
      .select("startTime duration engagementScore")
      .limit(50);

    if (sessions.length < 5) {
      return {
        hour: 10, // Default morning time
        dayOfWeek: 1, // Monday
        dayName: "Monday",
        confidence: 0,
      };
    }

    // Group by hour and day of week
    const timeAnalysis = {};
    sessions.forEach((session) => {
      const hour = session.startTime.getHours();
      const dayOfWeek = session.startTime.getDay();
      const key = `${dayOfWeek}-${hour}`;

      if (!timeAnalysis[key]) {
        timeAnalysis[key] = {
          hour,
          dayOfWeek,
          sessions: [],
          totalEngagement: 0,
        };
      }

      timeAnalysis[key].sessions.push(session);
      timeAnalysis[key].totalEngagement += session.engagementScore || 70;
    });

    // Find the time slot with highest average engagement
    let bestSlot = null;
    let bestScore = 0;

    Object.values(timeAnalysis).forEach((slot) => {
      if (slot.sessions.length >= 2) {
        // Need at least 2 sessions
        const avgEngagement = slot.totalEngagement / slot.sessions.length;
        if (avgEngagement > bestScore) {
          bestScore = avgEngagement;
          bestSlot = slot;
        }
      }
    });

    if (bestSlot) {
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      return {
        hour: bestSlot.hour,
        dayOfWeek: bestSlot.dayOfWeek,
        dayName: dayNames[bestSlot.dayOfWeek],
        confidence: Math.min(bestSlot.sessions.length * 20, 100),
      };
    }

    return {
      hour: 10,
      dayOfWeek: 1,
      dayName: "Monday",
      confidence: 0,
    };
  }

  async recommendOptimalAIPersonality(userId, analytics) {
    // Analyze user's learning patterns to recommend best AI personality
    const user = await User.findById(userId);
    const currentPersonality = user.learningProfile.aiPersonality;

    // Simple heuristic - in production would use more sophisticated analysis
    if (
      analytics.progress.completionRate < 40 &&
      analytics.engagement.focusScore < 50
    ) {
      return "COACH"; // More motivational for struggling users
    } else if (analytics.progress.averageModuleScore > 85) {
      return "SAGE"; // More challenging for high performers
    } else {
      return "ARIA"; // Balanced for average performers
    }
  }

  calculateValidUntil(recommendationType) {
    const now = new Date();
    const validityPeriods = {
      next_module: 7, // 1 week
      skill_development: 14, // 2 weeks
      schedule_optimization: 21, // 3 weeks
      ai_personality: 30, // 1 month
      study_break: 3, // 3 days
      review_content: 10, // 10 days
    };

    const days = validityPeriods[recommendationType] || 14;
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  getPriorityLevel(priorityScore) {
    if (priorityScore >= 80) return "high";
    if (priorityScore >= 50) return "medium";
    return "low";
  }

  estimateActionTime(recommendation) {
    const timeEstimates = {
      next_module: "30-45 minutes",
      skill_development: "1-2 hours",
      schedule_optimization: "5-10 minutes",
      ai_personality: "Immediate",
      study_break: "15-30 minutes",
      review_content: "20-30 minutes",
    };

    return timeEstimates[recommendation.type] || "15-30 minutes";
  }

  async calculateUserContextScore(recommendation, userId, analytics) {
    // Score based on how well the recommendation fits the user's current context
    let score = 50; // Base score

    // Boost score if recommendation aligns with user's goals
    const user = await User.findById(userId);
    if (
      user.learningProfile.goals.some((goal) =>
        recommendation.category.toLowerCase().includes(goal.toLowerCase())
      )
    ) {
      score += 20;
    }

    // Boost score if recommendation addresses current struggles
    if (
      recommendation.type === "skill_development" &&
      analytics.performance.strugglePatterns.some(
        (pattern) => pattern.category === recommendation.category
      )
    ) {
      score += 25;
    }

    // Reduce score if user recently declined similar recommendations
    const recentDeclines = await RecommendationEngine.countDocuments({
      user: userId,
      type: recommendation.type,
      "userInteraction.response": "declined",
      "timing.generatedAt": {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    });

    score -= recentDeclines * 15;

    return Math.max(0, Math.min(100, score));
  }

  calculateTimingScore(recommendation) {
    // Score based on timing appropriateness
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    let score = 50; // Base score

    // Boost score for learning-related recommendations during typical learning hours
    if (
      ["next_module", "skill_development", "review_content"].includes(
        recommendation.type
      )
    ) {
      if (hour >= 9 && hour <= 22) {
        // 9 AM to 10 PM
        score += 20;
      }
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Weekdays
        score += 10;
      }
    }

    // Schedule optimization recommendations are good anytime
    if (recommendation.type === "schedule_optimization") {
      score += 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  // Additional methods would be implemented here...
}

const recommendationService = new RecommendationService();
module.exports = { recommendationService };
