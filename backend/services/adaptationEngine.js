// services/adaptationEngine.js
const AdaptationRule = require("../models/AdaptationRule");
const LearningAnalytics = require("../models/LearningAnalytics");
const User = require("../models/User");
const { analyticsService } = require("./analyticsService");

class AdaptationEngine {
  /**
   * Process adaptations for a specific user
   */
  async processUserAdaptations(userId) {
    try {
      // Get user's latest analytics
      const analytics = await LearningAnalytics.getLatestAnalytics(userId);
      if (!analytics) {
        console.log(
          `No analytics data for user ${userId}, skipping adaptations`
        );
        return;
      }

      // Get user context
      const user = await User.findById(userId);
      const userContext = {
        userId,
        category: this.getCurrentUserCategory(user),
        difficulty: this.getCurrentUserDifficulty(analytics),
        learningStyle: user.learningProfile.learningStyle,
      };

      // Get applicable adaptation rules
      const applicableRules = await AdaptationRule.getApplicableRules(
        userContext
      );

      const adaptationsApplied = [];

      // Process each rule
      for (const rule of applicableRules) {
        const shouldApply = await this.evaluateRule(
          rule,
          analytics,
          userContext
        );

        if (shouldApply && !rule.isInCooldown()) {
          const adaptation = await this.applyRule(rule, userId, analytics);
          if (adaptation.success) {
            adaptationsApplied.push(adaptation);
            await rule.recordTrigger(true);
          } else {
            await rule.recordTrigger(false);
          }
        }
      }

      return {
        userId,
        adaptationsApplied,
        totalRulesEvaluated: applicableRules.length,
        analytics: {
          completionRate: analytics.progress.completionRate,
          engagementScore: analytics.engagement.focusScore,
        },
      };
    } catch (error) {
      console.error(`Error processing adaptations for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Evaluate if a rule should be applied
   */
  async evaluateRule(rule, analytics, userContext) {
    try {
      // Check basic conditions from the rule
      if (!rule.checkConditions(analytics, userContext)) {
        return false;
      }

      // Additional context-specific checks
      return this.performAdvancedRuleEvaluation(rule, analytics, userContext);
    } catch (error) {
      console.error(`Error evaluating rule ${rule.name}:`, error);
      return false;
    }
  }

  /**
   * Apply a specific adaptation rule
   */
  async applyRule(rule, userId, analytics) {
    try {
      console.log(`Applying adaptation rule "${rule.name}" for user ${userId}`);

      const actions = rule.adaptationActions;
      const results = {
        ruleName: rule.name,
        actionsApplied: [],
        success: true,
        timestamp: new Date(),
      };

      // Apply content adaptations
      if (
        actions.content &&
        Object.keys(actions.content).some((key) => actions.content[key])
      ) {
        const contentResult = await this.applyContentAdaptations(
          userId,
          actions.content,
          analytics
        );
        results.actionsApplied.push({ type: "content", ...contentResult });
      }

      // Apply AI personality adaptations
      if (
        actions.aiPersonality &&
        Object.keys(actions.aiPersonality).some(
          (key) => actions.aiPersonality[key]
        )
      ) {
        const aiResult = await this.applyAIAdaptations(
          userId,
          actions.aiPersonality
        );
        results.actionsApplied.push({ type: "aiPersonality", ...aiResult });
      }

      // Apply pace adaptations
      if (
        actions.pace &&
        Object.keys(actions.pace).some((key) => actions.pace[key])
      ) {
        const paceResult = await this.applyPaceAdaptations(
          userId,
          actions.pace
        );
        results.actionsApplied.push({ type: "pace", ...paceResult });
      }

      // Apply intervention actions
      if (
        actions.intervention &&
        Object.keys(actions.intervention).some(
          (key) => actions.intervention[key]
        )
      ) {
        const interventionResult = await this.applyInterventions(
          userId,
          actions.intervention
        );
        results.actionsApplied.push({
          type: "intervention",
          ...interventionResult,
        });
      }

      // Apply recommendation actions
      if (
        actions.recommendations &&
        Object.keys(actions.recommendations).some(
          (key) => actions.recommendations[key]
        )
      ) {
        const recommendationResult = await this.applyRecommendationActions(
          userId,
          actions.recommendations
        );
        results.actionsApplied.push({
          type: "recommendations",
          ...recommendationResult,
        });
      }

      return results;
    } catch (error) {
      console.error(`Error applying rule ${rule.name}:`, error);
      return {
        ruleName: rule.name,
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Apply content-related adaptations
   */
  async applyContentAdaptations(userId, contentActions, analytics) {
    const actions = [];

    try {
      // Adjust difficulty
      if (contentActions.adjustDifficulty) {
        const difficultyAction = await this.adjustContentDifficulty(
          userId,
          contentActions.adjustDifficulty,
          analytics
        );
        actions.push(difficultyAction);
      }

      // Change content format
      if (contentActions.changeContentFormat) {
        const formatAction = await this.changeContentFormat(
          userId,
          contentActions.changeContentFormat
        );
        actions.push(formatAction);
      }

      // Add supplementary resources
      if (contentActions.addSupplementaryResources) {
        const resourceAction = await this.addSupplementaryResources(
          userId,
          analytics
        );
        actions.push(resourceAction);
      }

      // Enable hints
      if (contentActions.enableHints) {
        const hintAction = await this.enableHints(userId);
        actions.push(hintAction);
      }

      return {
        success: true,
        actions,
        message: "Content adaptations applied successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        actions,
      };
    }
  }

  /**
   * Apply AI personality adaptations
   */
  async applyAIAdaptations(userId, aiActions) {
    try {
      const user = await User.findById(userId);
      const updates = {};
      const actions = [];

      // Switch AI personality
      if (aiActions.switchTo && aiActions.switchTo !== "auto") {
        updates["learningProfile.aiPersonality"] = aiActions.switchTo;
        actions.push({
          action: "personality_switch",
          from: user.learningProfile.aiPersonality,
          to: aiActions.switchTo,
        });
      } else if (aiActions.switchTo === "auto") {
        // Determine optimal personality based on user data
        const optimalPersonality = await this.determineOptimalAIPersonality(
          userId
        );
        if (optimalPersonality !== user.learningProfile.aiPersonality) {
          updates["learningProfile.aiPersonality"] = optimalPersonality;
          actions.push({
            action: "auto_personality_switch",
            from: user.learningProfile.aiPersonality,
            to: optimalPersonality,
          });
        }
      }

      // Adjust tone (stored in user preferences)
      if (aiActions.adjustTone) {
        updates["learningProfile.aiPreferences.tone"] = aiActions.adjustTone;
        actions.push({
          action: "tone_adjustment",
          tone: aiActions.adjustTone,
        });
      }

      // Increase support level
      if (aiActions.increaseSupport) {
        updates["learningProfile.aiPreferences.supportLevel"] = "high";
        actions.push({
          action: "support_increase",
          level: "high",
        });
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(userId, updates);
      }

      return {
        success: true,
        actions,
        message: "AI adaptations applied successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Apply pace-related adaptations
   */
  async applyPaceAdaptations(userId, paceActions) {
    try {
      const actions = [];

      // Suggest break
      if (paceActions.suggestBreak) {
        actions.push(await this.suggestBreak(userId));
      }

      // Adjust session length
      if (paceActions.adjustSessionLength) {
        actions.push(
          await this.adjustSessionLength(
            userId,
            paceActions.adjustSessionLength
          )
        );
      }

      // Recommend schedule
      if (paceActions.recommendSchedule) {
        actions.push(await this.recommendSchedule(userId));
      }

      return {
        success: true,
        actions,
        message: "Pace adaptations applied successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Apply intervention actions
   */
  async applyInterventions(userId, interventionActions) {
    try {
      const actions = [];

      // Send notification
      if (interventionActions.sendNotification) {
        const notification = await this.sendInterventionNotification(userId);
        actions.push(notification);
      }

      // Schedule check-in
      if (interventionActions.scheduleCheckin) {
        const checkin = await this.scheduleCheckin(userId);
        actions.push(checkin);
      }

      // Offer tutoring
      if (interventionActions.offerTutoring) {
        const tutoring = await this.offerTutoring(userId);
        actions.push(tutoring);
      }

      // Suggest peer support
      if (interventionActions.suggestPeerSupport) {
        const peerSupport = await this.suggestPeerSupport(userId);
        actions.push(peerSupport);
      }

      return {
        success: true,
        actions,
        message: "Interventions applied successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Apply recommendation actions
   */
  async applyRecommendationActions(userId, recommendationActions) {
    try {
      const { recommendationService } = require("./recommendationService");
      const actions = [];

      // Suggest new path
      if (recommendationActions.suggestNewPath) {
        const pathRec =
          await recommendationService.generatePersonalizedRecommendations(
            userId,
            {
              maxRecommendations: 1,
              context: { type: "learning_path" },
            }
          );
        actions.push({
          action: "new_path_suggested",
          recommendations: pathRec.length,
        });
      }

      // Recommend review
      if (recommendationActions.recommendReview) {
        const reviewRec =
          await recommendationService.generatePersonalizedRecommendations(
            userId,
            {
              maxRecommendations: 1,
              context: { type: "review_content" },
            }
          );
        actions.push({
          action: "review_recommended",
          recommendations: reviewRec.length,
        });
      }

      // Propose alternative module
      if (recommendationActions.proposeAlternativeModule) {
        const altRec =
          await recommendationService.generatePersonalizedRecommendations(
            userId,
            {
              maxRecommendations: 1,
              context: { type: "next_module" },
            }
          );
        actions.push({
          action: "alternative_module_proposed",
          recommendations: altRec.length,
        });
      }

      return {
        success: true,
        actions,
        message: "Recommendation actions applied successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Helper methods for specific adaptations

  async adjustContentDifficulty(userId, direction, analytics) {
    // This would integrate with content delivery system
    // For now, store preference in user profile
    const adjustment =
      direction === "increase" ? 1 : direction === "decrease" ? -1 : 0;

    await User.findByIdAndUpdate(userId, {
      $inc: { "learningProfile.difficultyAdjustment": adjustment },
    });

    return {
      action: "difficulty_adjusted",
      direction,
      reason: `Based on ${analytics.progress.completionRate}% completion rate`,
    };
  }

  async changeContentFormat(userId, format) {
    await User.findByIdAndUpdate(userId, {
      "learningProfile.preferredFormat": format,
    });

    return {
      action: "format_changed",
      format,
      reason: "Optimizing for learning style",
    };
  }

  async addSupplementaryResources(userId, analytics) {
    // Would integrate with resource recommendation system
    return {
      action: "resources_added",
      resourceCount: 3,
      reason: "Additional support for struggling areas",
    };
  }

  async enableHints(userId) {
    await User.findByIdAndUpdate(userId, {
      "learningProfile.hintsEnabled": true,
    });

    return {
      action: "hints_enabled",
      reason: "Providing additional guidance",
    };
  }

  async determineOptimalAIPersonality(userId) {
    const analytics = await LearningAnalytics.getLatestAnalytics(userId);

    if (!analytics) return "ARIA"; // Default

    // Simple heuristic - would be more sophisticated in production
    if (
      analytics.progress.completionRate < 40 &&
      analytics.engagement.focusScore < 50
    ) {
      return "COACH"; // More motivational
    } else if (analytics.progress.averageModuleScore > 85) {
      return "SAGE"; // More challenging
    } else {
      return "ARIA"; // Balanced
    }
  }

  async suggestBreak(userId) {
    // Would integrate with notification system
    return {
      action: "break_suggested",
      duration: "15 minutes",
      reason: "Preventing burnout",
    };
  }

  async adjustSessionLength(userId, adjustment) {
    const user = await User.findById(userId);
    const currentLength = user.learningProfile.preferredSessionLength || 30;
    let newLength;

    switch (adjustment) {
      case "shorter":
        newLength = Math.max(15, currentLength - 10);
        break;
      case "longer":
        newLength = Math.min(90, currentLength + 15);
        break;
      default:
        newLength = currentLength;
    }

    await User.findByIdAndUpdate(userId, {
      "learningProfile.preferredSessionLength": newLength,
    });

    return {
      action: "session_length_adjusted",
      from: currentLength,
      to: newLength,
      adjustment,
    };
  }

  async recommendSchedule(userId) {
    // Would integrate with scheduling system
    return {
      action: "schedule_recommended",
      suggestion: "3 sessions per week, 30 minutes each",
      reason: "Based on optimal learning patterns",
    };
  }

  async sendInterventionNotification(userId) {
    // Would integrate with notification system
    return {
      action: "notification_sent",
      type: "intervention",
      message: "Learning support available",
    };
  }

  async scheduleCheckin(userId) {
    // Would integrate with scheduling system
    return {
      action: "checkin_scheduled",
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      type: "automated",
    };
  }

  async offerTutoring(userId) {
    // Would integrate with tutoring system
    return {
      action: "tutoring_offered",
      type: "ai_assisted",
      availability: "immediate",
    };
  }

  async suggestPeerSupport(userId) {
    // Would integrate with peer matching system
    return {
      action: "peer_support_suggested",
      type: "study_group",
      matchingCriteria: "similar_learning_level",
    };
  }

  // Utility methods

  getCurrentUserCategory(user) {
    // Determine user's current primary learning category
    // This would analyze their recent progress
    return "General"; // Simplified for now
  }

  getCurrentUserDifficulty(analytics) {
    // Determine appropriate difficulty based on performance
    const avgScore = analytics.progress.averageModuleScore;

    if (avgScore > 85) return "advanced";
    if (avgScore > 70) return "intermediate";
    return "beginner";
  }

  async performAdvancedRuleEvaluation(rule, analytics, userContext) {
    // Additional sophisticated checks could go here
    // For now, return true if basic conditions pass
    return true;
  }

  /**
   * Get adaptation statistics
   */
  async getAdaptationStats(timeRange = "7d") {
    try {
      const startDate = new Date();
      const days = parseInt(timeRange.replace("d", ""));
      startDate.setDate(startDate.getDate() - days);

      const rules = await AdaptationRule.find({
        lastTriggered: { $gte: startDate },
      });

      const stats = {
        totalRules: await AdaptationRule.countDocuments({ isActive: true }),
        triggeredRules: rules.length,
        successfulAdaptations: rules.reduce(
          (sum, rule) =>
            sum + rule.configuration.effectiveness.successfulAdaptations,
          0
        ),
        totalTriggers: rules.reduce(
          (sum, rule) => sum + rule.configuration.effectiveness.totalTriggers,
          0
        ),
      };

      stats.successRate =
        stats.totalTriggers > 0
          ? ((stats.successfulAdaptations / stats.totalTriggers) * 100).toFixed(
              1
            )
          : 0;

      return stats;
    } catch (error) {
      console.error("Error getting adaptation stats:", error);
      return null;
    }
  }
}

const adaptationEngine = new AdaptationEngine();
module.exports = { adaptationEngine };
