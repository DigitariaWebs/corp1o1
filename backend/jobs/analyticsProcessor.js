// jobs/analyticsProcessor.js
const { analyticsService } = require('../services/analyticsService');
const User = require('../models/User');
const LearningAnalytics = require('../models/LearningAnalytics');

class AnalyticsProcessor {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.processingInterval = 60 * 60 * 1000; // 60 minutes
    this.dailyProcessingTime = 2; // 2 AM
  }

  /**
   * Start the analytics processor
   */
  async start() {
    if (this.isRunning) {
      console.log('Analytics processor is already running');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Starting analytics processor...');

    // Process immediately on startup
    await this.processAnalytics();

    // Set up regular processing interval
    this.intervalId = setInterval(async () => {
      await this.processAnalytics();
    }, this.processingInterval);

    // Set up daily comprehensive processing
    this.setupDailyProcessing();

    console.log('✅ Analytics processor started');
  }

  /**
   * Stop the analytics processor
   */
  async stop() {
    if (!this.isRunning) {
      console.log('Analytics processor is not running');
      return;
    }

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.dailyTimeoutId) {
      clearTimeout(this.dailyTimeoutId);
      this.dailyTimeoutId = null;
    }

    console.log('🛑 Analytics processor stopped');
  }

  /**
   * Process analytics for all active users
   */
  async processAnalytics() {
    try {
      console.log('📊 Processing user analytics...');

      // Get users who have had recent activity
      const activeUsers = await this.getActiveUsers();

      if (activeUsers.length === 0) {
        console.log('No active users to process');
        return;
      }

      let processed = 0;
      let errors = 0;

      // Process analytics for each active user
      for (const user of activeUsers) {
        try {
          await this.processUserAnalytics(user._id);
          processed++;
        } catch (error) {
          console.error(
            `Error processing analytics for user ${user._id}:`,
            error,
          );
          errors++;
        }
      }

      console.log(
        `📈 Analytics processing complete: ${processed} users processed, ${errors} errors`,
      );

      // Cleanup old analytics data
      await this.cleanupOldAnalytics();
    } catch (error) {
      console.error('Error in analytics processing:', error);
    }
  }

  /**
   * Process analytics for a specific user
   */
  async processUserAnalytics(userId) {
    try {
      // Calculate daily analytics
      await analyticsService.calculateUserAnalytics(userId, 'daily');

      // Calculate weekly analytics if it's a new week
      if (this.shouldCalculateWeekly()) {
        await analyticsService.calculateUserAnalytics(userId, 'weekly');
      }

      // Calculate monthly analytics if it's a new month
      if (this.shouldCalculateMonthly()) {
        await analyticsService.calculateUserAnalytics(userId, 'monthly');
      }

      // Generate insights and recommendations
      await this.generateUserInsights(userId);
    } catch (error) {
      console.error(`Error processing analytics for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Generate insights and recommendations for user
   */
  async generateUserInsights(userId) {
    try {
      // Check if user needs new recommendations
      const RecommendationEngine = require('../models/RecommendationEngine');
      const activeRecommendations = await RecommendationEngine.countDocuments({
        user: userId,
        'userInteraction.status': { $in: ['pending', 'viewed'] },
        'timing.validUntil': { $gt: new Date() },
      });

      // Generate new recommendations if user has fewer than 3 active ones
      if (activeRecommendations < 3) {
        const {
          recommendationService,
        } = require('../services/recommendationService');
        const analytics = await LearningAnalytics.getLatestAnalytics(userId);

        if (analytics) {
          await recommendationService.generatePersonalizedRecommendations(
            userId,
            {
              analytics,
              maxRecommendations: 5 - activeRecommendations,
            },
          );
        }
      }

      // Check adaptation rules
      await this.checkAdaptationRules(userId);
    } catch (error) {
      console.error(`Error generating insights for user ${userId}:`, error);
    }
  }

  /**
   * Check and apply adaptation rules for user
   */
  async checkAdaptationRules(userId) {
    try {
      const AdaptationRule = require('../models/AdaptationRule');
      const analytics = await LearningAnalytics.getLatestAnalytics(userId);

      if (!analytics) return;

      // Get applicable adaptation rules
      const rules = await AdaptationRule.getApplicableRules({
        userId,
        category: 'General', // Would be more specific in real implementation
      });

      for (const rule of rules) {
        // Check if rule conditions are met
        if (rule.checkConditions(analytics, { userId })) {
          // Check cooldown period
          if (!rule.isInCooldown()) {
            await this.applyAdaptationRule(rule, userId, analytics);
            await rule.recordTrigger(true);
          }
        }
      }
    } catch (error) {
      console.error(
        `Error checking adaptation rules for user ${userId}:`,
        error,
      );
    }
  }

  /**
   * Apply an adaptation rule
   */
  async applyAdaptationRule(rule, userId, analytics) {
    try {
      console.log(`Applying adaptation rule "${rule.name}" for user ${userId}`);

      const actions = rule.adaptationActions;

      // Content adaptations
      if (actions.content) {
        await this.applyContentAdaptations(userId, actions.content);
      }

      // AI personality adaptations
      if (actions.aiPersonality) {
        await this.applyAIAdaptations(userId, actions.aiPersonality);
      }

      // Pace adaptations
      if (actions.pace) {
        await this.applyPaceAdaptations(userId, actions.pace);
      }

      // Intervention actions
      if (actions.intervention) {
        await this.applyInterventions(userId, actions.intervention);
      }

      // Recommendation actions
      if (actions.recommendations) {
        await this.applyRecommendationActions(userId, actions.recommendations);
      }
    } catch (error) {
      console.error(`Error applying adaptation rule ${rule.name}:`, error);
    }
  }

  /**
   * Apply content adaptations
   */
  async applyContentAdaptations(userId, contentActions) {
    // This would integrate with content delivery system
    // For now, just log the actions
    console.log(`Content adaptations for user ${userId}:`, contentActions);
  }

  /**
   * Apply AI personality adaptations
   */
  async applyAIAdaptations(userId, aiActions) {
    if (aiActions.switchTo && aiActions.switchTo !== 'auto') {
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, {
        'learningProfile.aiPersonality': aiActions.switchTo,
      });
      console.log(
        `Switched AI personality to ${aiActions.switchTo} for user ${userId}`,
      );
    }
  }

  /**
   * Apply pace adaptations
   */
  async applyPaceAdaptations(userId, paceActions) {
    // This would integrate with scheduling system
    console.log(`Pace adaptations for user ${userId}:`, paceActions);
  }

  /**
   * Apply interventions
   */
  async applyInterventions(userId, interventionActions) {
    if (interventionActions.sendNotification) {
      // Would integrate with notification system
      console.log(`Sending intervention notification to user ${userId}`);
    }

    if (interventionActions.scheduleCheckin) {
      // Would integrate with scheduling system
      console.log(`Scheduling check-in for user ${userId}`);
    }
  }

  /**
   * Apply recommendation actions
   */
  async applyRecommendationActions(userId, recommendationActions) {
    const {
      recommendationService,
    } = require('../services/recommendationService');

    if (recommendationActions.suggestNewPath) {
      // Generate learning path recommendations
      await recommendationService.generatePersonalizedRecommendations(userId, {
        maxRecommendations: 2,
        type: 'learning_path',
      });
    }
  }

  /**
   * Get users who have had recent activity
   */
  async getActiveUsers() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get users who have had sessions or progress updates in the last 24 hours
    const LearningSession = require('../models/LearningSession');
    const UserProgress = require('../models/UserProgress');

    const recentSessionUsers = await LearningSession.distinct('user', {
      startTime: { $gte: twentyFourHoursAgo },
    });

    const recentProgressUsers = await UserProgress.distinct('user', {
      updatedAt: { $gte: twentyFourHoursAgo },
    });

    // Combine and get unique user IDs
    const allActiveUserIds = [
      ...new Set([...recentSessionUsers, ...recentProgressUsers]),
    ];

    // Get user documents
    return await User.find({
      _id: { $in: allActiveUserIds },
    }).select('_id email learningProfile');
  }

  /**
   * Setup daily comprehensive processing
   */
  setupDailyProcessing() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(this.dailyProcessingTime, 0, 0, 0);

    const msUntilTomorrow = tomorrow.getTime() - now.getTime();

    this.dailyTimeoutId = setTimeout(async () => {
      await this.runDailyProcessing();

      // Set up recurring daily processing
      this.dailyIntervalId = setInterval(async () => {
        await this.runDailyProcessing();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, msUntilTomorrow);
  }

  /**
   * Run comprehensive daily processing
   */
  async runDailyProcessing() {
    try {
      console.log('🌅 Running daily analytics processing...');

      // Process all users for daily analytics
      const allUsers = await User.find({}).select('_id');

      for (const user of allUsers) {
        await analyticsService.calculateUserAnalytics(user._id, 'daily');
      }

      // Clean up expired recommendations
      const RecommendationEngine = require('../models/RecommendationEngine');
      const expiredCount = await RecommendationEngine.cleanupExpired();
      console.log(`🧹 Cleaned up ${expiredCount} expired recommendations`);

      // Clean up old analytics data
      const deletedCount = await LearningAnalytics.cleanupOldAnalytics(365);
      console.log(`🧹 Cleaned up ${deletedCount} old analytics records`);

      console.log('✅ Daily analytics processing complete');
    } catch (error) {
      console.error('Error in daily analytics processing:', error);
    }
  }

  /**
   * Clean up old analytics data
   */
  async cleanupOldAnalytics() {
    try {
      // Clean up analytics older than 1 year
      const deleted = await LearningAnalytics.cleanupOldAnalytics(365);
      if (deleted > 0) {
        console.log(`🧹 Cleaned up ${deleted} old analytics records`);
      }
    } catch (error) {
      console.error('Error cleaning up analytics:', error);
    }
  }

  /**
   * Check if weekly analytics should be calculated
   */
  shouldCalculateWeekly() {
    const now = new Date();
    return now.getDay() === 1 && now.getHours() === this.dailyProcessingTime; // Monday at processing time
  }

  /**
   * Check if monthly analytics should be calculated
   */
  shouldCalculateMonthly() {
    const now = new Date();
    return now.getDate() === 1 && now.getHours() === this.dailyProcessingTime; // 1st of month at processing time
  }

  /**
   * Get processor status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      processingInterval: this.processingInterval,
      dailyProcessingTime: this.dailyProcessingTime,
      nextProcessing: this.intervalId
        ? new Date(Date.now() + this.processingInterval).toISOString()
        : null,
    };
  }
}

// Create singleton instance
const analyticsProcessor = new AnalyticsProcessor();

// Export functions for server.js
const startAnalyticsProcessor = async () => {
  await analyticsProcessor.start();
};

const stopAnalyticsProcessor = async () => {
  await analyticsProcessor.stop();
};

const getAnalyticsProcessorStatus = () => {
  return analyticsProcessor.getStatus();
};

module.exports = {
  analyticsProcessor,
  startAnalyticsProcessor,
  stopAnalyticsProcessor,
  getAnalyticsProcessorStatus,
};
