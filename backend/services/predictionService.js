// services/predictionService.js
const LearningAnalytics = require("../models/LearningAnalytics");
const UserProgress = require("../models/UserProgress");
const User = require("../models/User");
const LearningPath = require("../models/LearningPath");
const LearningModule = require("../models/LearningModule");
const { predictionModels } = require("../utils/predictionModels");
const { dataAnalyzer } = require("../utils/dataAnalyzer");

class PredictionService {
  /**
   * Predict completion likelihood for user's current learning activities
   */
  async predictCompletionLikelihood(userId) {
    try {
      const user = await User.findById(userId);
      const analytics = await LearningAnalytics.getLatestAnalytics(userId);

      if (!analytics) {
        return {
          currentPath: null,
          nextModule: null,
          message: "Insufficient data for predictions",
        };
      }

      // Get current active progress
      const activeProgress = await UserProgress.find({
        user: userId,
        completionStatus: { $in: ["not_started", "in_progress"] },
      }).populate("learningPath learningModule");

      const predictions = {};

      // Predict current path completion
      if (activeProgress.length > 0) {
        const currentPath = activeProgress[0].learningPath;
        predictions.currentPath = await this.predictPathCompletion(
          userId,
          currentPath._id,
          analytics
        );
      }

      // Predict next module completion
      const nextModule = await this.getNextModule(userId);
      if (nextModule) {
        predictions.nextModule = await this.predictModuleCompletion(
          userId,
          nextModule._id,
          analytics
        );
      }

      return predictions;
    } catch (error) {
      console.error("Error predicting completion likelihood:", error);
      throw error;
    }
  }

  /**
   * Predict time to completion for current learning activities
   */
  async predictTimeToCompletion(userId) {
    try {
      const analytics = await LearningAnalytics.getLatestAnalytics(userId);

      if (!analytics) {
        return {
          currentPath: null,
          estimatedAccuracy: 0,
          message: "Insufficient data for time predictions",
        };
      }

      // Calculate learning velocity
      const velocity = analytics.calculateLearningVelocity(); // modules per week

      // Get remaining modules in current paths
      const activeProgress = await UserProgress.find({
        user: userId,
        completionStatus: { $in: ["not_started", "in_progress"] },
      }).populate("learningPath");

      const predictions = {};

      for (const progress of activeProgress) {
        const path = progress.learningPath;
        const totalModules = await LearningModule.countDocuments({
          learningPath: path._id,
        });
        const completedModules = await UserProgress.countDocuments({
          user: userId,
          learningPath: path._id,
          completionStatus: "completed",
        });

        const remainingModules = totalModules - completedModules;

        // Predict time based on current velocity and historical patterns
        const baseTime =
          velocity > 0 ? (remainingModules / velocity) * 7 : null; // days

        // Adjust based on difficulty and user patterns
        const adjustedTime = await this.adjustTimeForDifficulty(
          userId,
          path._id,
          baseTime,
          analytics
        );

        predictions[path._id] = {
          pathTitle: path.title,
          remainingModules,
          estimatedDays: Math.round(adjustedTime),
          estimatedWeeks: Math.round(adjustedTime / 7),
          confidence: this.calculatePredictionConfidence(analytics),
          factors: {
            currentVelocity: velocity,
            difficultyAdjustment: adjustedTime / baseTime,
            consistencyFactor: analytics.engagement.focusScore / 100,
          },
        };
      }

      return {
        predictions,
        estimatedAccuracy: this.calculateOverallAccuracy(analytics),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error predicting time to completion:", error);
      throw error;
    }
  }

  /**
   * Forecast performance trends
   */
  async forecastPerformance(userId, horizon = "1month") {
    try {
      const analytics = await LearningAnalytics.getUserAnalytics(
        userId,
        "weekly",
        12
      );

      if (analytics.length < 3) {
        return {
          forecast: [],
          confidence: "low",
          message: "Need more historical data for accurate forecasting",
        };
      }

      // Extract performance trends
      const performanceData = analytics.map((a) => ({
        week: a.period.startDate,
        completionRate: a.progress.completionRate,
        averageScore: a.progress.averageModuleScore,
        engagementScore: a.engagement.focusScore,
      }));

      // Use time series prediction
      const horizonWeeks = this.parseHorizon(horizon);
      const forecast = await predictionModels.forecastTimeSeries(
        performanceData,
        horizonWeeks
      );

      // Calculate confidence based on data consistency
      const confidence = this.calculateForecastConfidence(performanceData);

      return {
        forecast,
        confidence,
        insights: this.generateForecastInsights(forecast),
        basedOnWeeks: analytics.length,
        forecastPeriod: horizon,
      };
    } catch (error) {
      console.error("Error forecasting performance:", error);
      throw error;
    }
  }

  /**
   * Forecast engagement trends
   */
  async forecastEngagement(userId, horizon = "1month") {
    try {
      const analytics = await LearningAnalytics.getUserAnalytics(
        userId,
        "daily",
        30
      );

      if (analytics.length < 7) {
        return {
          forecast: [],
          confidence: "low",
          message: "Need at least one week of data for engagement forecasting",
        };
      }

      const engagementData = analytics.map((a) => ({
        date: a.period.startDate,
        sessionCount: a.engagement.sessionCount,
        focusScore: a.engagement.focusScore,
        sessionDuration: a.engagement.averageSessionDuration,
      }));

      const horizonDays = this.parseHorizon(horizon, "days");
      const forecast = await predictionModels.forecastEngagement(
        engagementData,
        horizonDays
      );

      return {
        forecast,
        insights: {
          predictedOptimalDays: forecast.optimalDays,
          riskOfDisengagement: forecast.riskLevel,
          recommendedInterventions: forecast.interventions,
        },
        confidence: this.calculateEngagementForecastConfidence(engagementData),
      };
    } catch (error) {
      console.error("Error forecasting engagement:", error);
      throw error;
    }
  }

  /**
   * Assess learning risks for user
   */
  async assessRisks(userId) {
    try {
      const analytics = await LearningAnalytics.getLatestAnalytics(userId);
      const user = await User.findById(userId);

      if (!analytics) {
        return {
          risks: [],
          overallRiskLevel: "unknown",
          message: "Insufficient data for risk assessment",
        };
      }

      const risks = [];

      // Check for disengagement risk
      if (analytics.engagement.focusScore < 40) {
        risks.push({
          type: "disengagement",
          severity: analytics.engagement.focusScore < 20 ? "high" : "medium",
          probability: this.calculateDisengagementProbability(analytics),
          description: "User showing signs of decreased engagement",
          recommendations: [
            "Adjust learning difficulty",
            "Try different AI personality",
            "Suggest shorter learning sessions",
          ],
          timeframe: "immediate",
        });
      }

      // Check for performance decline risk
      const recentAnalytics = await LearningAnalytics.getUserAnalytics(
        userId,
        "weekly",
        4
      );
      if (recentAnalytics.length >= 2) {
        const performanceTrend =
          this.calculatePerformanceTrend(recentAnalytics);
        if (performanceTrend.direction === "declining") {
          risks.push({
            type: "performance_decline",
            severity: performanceTrend.severity,
            probability: performanceTrend.confidence,
            description: "Performance metrics showing downward trend",
            recommendations: [
              "Review challenging topics",
              "Provide additional support resources",
              "Consider peer learning opportunities",
            ],
            timeframe: "1-2 weeks",
          });
        }
      }

      // Check for completion risk
      const completionRisk = await this.assessCompletionRisk(userId, analytics);
      if (completionRisk.risk > 0.3) {
        risks.push(completionRisk);
      }

      // Check for overexertion risk
      if (analytics.engagement.averageSessionDuration > 120) {
        // 2 hours
        risks.push({
          type: "overexertion",
          severity: "medium",
          probability: 0.6,
          description: "Long session durations may lead to burnout",
          recommendations: [
            "Suggest shorter, more frequent sessions",
            "Implement mandatory breaks",
            "Monitor fatigue indicators",
          ],
          timeframe: "ongoing",
        });
      }

      const overallRiskLevel = this.calculateOverallRiskLevel(risks);

      return {
        risks,
        overallRiskLevel,
        riskScore: this.calculateRiskScore(risks),
        assessmentDate: new Date().toISOString(),
        nextAssessment: this.getNextAssessmentDate(overallRiskLevel),
      };
    } catch (error) {
      console.error("Error assessing risks:", error);
      throw error;
    }
  }

  /**
   * Suggest optimal next steps for user
   */
  async suggestOptimalNextSteps(userId) {
    try {
      const analytics = await LearningAnalytics.getLatestAnalytics(userId);
      const user = await User.findById(userId);

      if (!analytics) {
        return {
          steps: [],
          message:
            "Complete some learning activities to get personalized next steps",
        };
      }

      // Get current progress
      const currentProgress = await UserProgress.find({
        user: userId,
        completionStatus: { $in: ["not_started", "in_progress"] },
      }).populate("learningPath learningModule");

      const steps = [];

      // Immediate next steps based on current progress
      if (currentProgress.length > 0) {
        const inProgress = currentProgress.filter(
          (p) => p.completionStatus === "in_progress"
        );
        if (inProgress.length > 0) {
          steps.push({
            type: "continue_current",
            priority: "high",
            title: `Continue ${inProgress[0].learningModule.title}`,
            description: "Complete your current module to maintain momentum",
            estimatedTime: this.estimateModuleTimeRemaining(inProgress[0]),
            action: {
              type: "continue_module",
              moduleId: inProgress[0].learningModule._id,
            },
          });
        }
      }

      // Skill development recommendations
      const skillGaps = await this.identifySkillGaps(userId, analytics);
      if (skillGaps.length > 0) {
        steps.push({
          type: "skill_development",
          priority: "medium",
          title: `Strengthen ${skillGaps[0].skill}`,
          description: `Focus on improving ${skillGaps[0].skill} to enhance overall performance`,
          estimatedTime: skillGaps[0].estimatedTimeToImprove,
          action: {
            type: "skill_focus",
            skill: skillGaps[0].skill,
            suggestedModules: skillGaps[0].suggestedModules,
          },
        });
      }

      // Engagement optimization
      if (analytics.engagement.focusScore < 70) {
        steps.push({
          type: "engagement_optimization",
          priority: "medium",
          title: "Optimize Learning Schedule",
          description: "Adjust your learning schedule for better engagement",
          estimatedTime: "5-10 minutes setup",
          action: {
            type: "schedule_optimization",
            suggestions: await this.getScheduleOptimizations(userId, analytics),
          },
        });
      }

      // AI personality optimization
      if (analytics.aiInteraction.satisfactionScore < 3.5) {
        steps.push({
          type: "ai_optimization",
          priority: "low",
          title: "Try Different AI Assistant Style",
          description:
            "Switch AI personality to better match your learning preferences",
          estimatedTime: "Immediate",
          action: {
            type: "ai_personality_change",
            currentPersonality: user.learningProfile.aiPersonality,
            recommendedPersonality: await this.recommendOptimalAIPersonality(
              userId,
              analytics
            ),
          },
        });
      }

      // Sort by priority and return top recommendations
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      steps.sort(
        (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
      );

      return {
        steps: steps.slice(0, 5), // Top 5 recommendations
        personalizedMessage: this.generatePersonalizedMessage(
          userId,
          analytics,
          steps
        ),
        optimizedFor: this.getOptimizationFocus(analytics),
      };
    } catch (error) {
      console.error("Error suggesting optimal next steps:", error);
      throw error;
    }
  }

  /**
   * Forecast skill progression
   */
  async forecastSkillProgression(userId) {
    try {
      const user = await User.findById(userId);
      const analytics = await LearningAnalytics.getLatestAnalytics(userId);

      if (!analytics) {
        return {
          skills: [],
          message: "Need more learning data to forecast skill progression",
        };
      }

      // Get user's learning history by category (as proxy for skills)
      const progressByCategory = await this.getProgressByCategory(userId);

      const skillForecasts = [];

      for (const [category, data] of Object.entries(progressByCategory)) {
        const currentLevel = this.assessCurrentSkillLevel(data);
        const progression = await this.predictSkillProgression(data, analytics);

        skillForecasts.push({
          skill: category,
          currentLevel,
          projectedLevel: progression.projectedLevel,
          timeToNextLevel: progression.timeToNextLevel,
          confidence: progression.confidence,
          milestones: progression.milestones,
          recommendations: progression.recommendations,
        });
      }

      return {
        skills: skillForecasts,
        overallProgression:
          this.calculateOverallSkillProgression(skillForecasts),
        timeframe: "3 months",
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error forecasting skill progression:", error);
      throw error;
    }
  }

  // Helper methods

  async predictPathCompletion(userId, pathId, analytics) {
    // Get path completion statistics and user patterns
    const totalModules = await LearningModule.countDocuments({
      learningPath: pathId,
    });
    const completedModules = await UserProgress.countDocuments({
      user: userId,
      learningPath: pathId,
      completionStatus: "completed",
    });

    const completionRate =
      totalModules > 0 ? completedModules / totalModules : 0;
    const velocity = analytics.calculateLearningVelocity();
    const engagementFactor = analytics.engagement.focusScore / 100;

    // Simple prediction model - in production would use more sophisticated ML
    const baseProbability =
      completionRate * 0.6 + velocity * 0.2 + engagementFactor * 0.2;
    const adjustedProbability = Math.min(
      Math.max(baseProbability * 100, 0),
      100
    );

    return {
      probability: Math.round(adjustedProbability),
      confidence: this.calculatePredictionConfidence(analytics),
      factors: {
        currentProgress: Math.round(completionRate * 100),
        learningVelocity: velocity,
        engagementLevel: Math.round(engagementFactor * 100),
      },
    };
  }

  async predictModuleCompletion(userId, moduleId, analytics) {
    // Get module difficulty and user performance patterns
    const module = await LearningModule.findById(moduleId);
    const userProgress = await UserProgress.findOne({
      user: userId,
      learningModule: moduleId,
    });

    // Factors affecting completion probability
    const difficultyFactor = this.getDifficultyFactor(module.difficulty);
    const engagementFactor = analytics.engagement.focusScore / 100;
    const performanceFactor = analytics.progress.averageModuleScore / 100;
    const progressFactor = userProgress
      ? userProgress.progressPercentage / 100
      : 0;

    const probability =
      (difficultyFactor * 0.2 +
        engagementFactor * 0.3 +
        performanceFactor * 0.3 +
        progressFactor * 0.2) *
      100;

    return {
      probability: Math.round(Math.min(Math.max(probability, 0), 100)),
      confidence: this.calculatePredictionConfidence(analytics),
      estimatedTimeToComplete: this.estimateModuleTime(module, analytics),
    };
  }

  async getNextModule(userId) {
    const inProgress = await UserProgress.findOne({
      user: userId,
      completionStatus: "in_progress",
    }).populate("learningModule");

    if (inProgress) {
      return inProgress.learningModule;
    }

    // Find next unstarted module
    const notStarted = await UserProgress.findOne({
      user: userId,
      completionStatus: "not_started",
    }).populate("learningModule");

    return notStarted ? notStarted.learningModule : null;
  }

  calculatePredictionConfidence(analytics) {
    // Base confidence on amount and quality of data
    const dataPoints = analytics.engagement.sessionCount;
    const consistency = analytics.engagement.focusScore;
    const timeRange = analytics.period.duration || 1;

    let confidence = 0;

    // More data points increase confidence
    if (dataPoints >= 10) confidence += 40;
    else if (dataPoints >= 5) confidence += 25;
    else confidence += 10;

    // Consistency in engagement increases confidence
    if (consistency >= 70) confidence += 30;
    else if (consistency >= 50) confidence += 20;
    else confidence += 10;

    // Longer observation period increases confidence
    if (timeRange >= 30) confidence += 30;
    else if (timeRange >= 14) confidence += 20;
    else confidence += 10;

    return Math.min(confidence, 100);
  }

  parseHorizon(horizon, unit = "weeks") {
    const value = parseInt(horizon.replace(/[^0-9]/g, ""));

    if (horizon.includes("week")) {
      return unit === "days" ? value * 7 : value;
    } else if (horizon.includes("month")) {
      return unit === "days" ? value * 30 : value * 4;
    } else if (horizon.includes("day")) {
      return unit === "weeks" ? Math.ceil(value / 7) : value;
    }

    return unit === "days" ? 30 : 4; // Default 1 month
  }

  getDifficultyFactor(difficulty) {
    const factors = {
      beginner: 0.9,
      intermediate: 0.7,
      advanced: 0.5,
      expert: 0.3,
    };
    return factors[difficulty] || 0.7;
  }

  // Additional helper methods would be implemented here...
  // (calculateDisengagementProbability, assessCompletionRisk, etc.)
}

const predictionService = new PredictionService();
module.exports = { predictionService };
