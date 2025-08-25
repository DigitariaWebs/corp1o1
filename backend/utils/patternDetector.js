// utils/patternDetector.js
const LearningSession = require("../models/LearningSession");
const UserProgress = require("../models/UserProgress");
const LearningAnalytics = require("../models/LearningAnalytics");
const { dataAnalyzer } = require("./dataAnalyzer");

class PatternDetector {

  /**
   * Detect various learning patterns for a user
   */
  async detectPatterns(userId, options = {}) {
    const { timeRange = "30d", patternTypes = ["all"], minConfidence = 60 } = options;

    const patterns = {};

    // Get detection methods based on requested pattern types
    const detectionMethods = this.getDetectionMethods(patternTypes);

    for (const method of detectionMethods) {
      try {
        const pattern = await this[method](userId, timeRange);
        if (pattern && pattern.confidence >= minConfidence) {
          patterns[pattern.type] = pattern;
        }
      } catch (error) {
        console.error(`Error detecting pattern ${method}:`, error);
      }
    }

    return patterns;
  }

  /**
   * Detect optimal learning times for user
   */
  async detectOptimalTiming(userId) {
    try {
      const sessions = await LearningSession.find({
        user: userId,
        startTime: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } // Last 60 days
      }).select("startTime duration engagementScore");

      if (sessions.length < 3) {
        return {
          type: "optimal_timing",
          confidence: 0,
          message: "Need more session data to detect timing patterns"
        };
      }

      // Analyze by hour of day
      const hourlyData = {};
      const dailyData = {};

      sessions.forEach(session => {
        const hour = session.startTime.getHours();
        const day = session.startTime.getDay();
        const engagement = session.engagementScore || 70;
        const duration = session.duration || 30;

        // Hourly analysis
        if (!hourlyData[hour]) {
          hourlyData[hour] = { 
            sessions: 0, 
            totalEngagement: 0, 
            totalDuration: 0,
            scores: []
          };
        }
        hourlyData[hour].sessions++;
        hourlyData[hour].totalEngagement += engagement;
        hourlyData[hour].totalDuration += duration;
        hourlyData[hour].scores.push(engagement);

        // Daily analysis
        if (!dailyData[day]) {
          dailyData[day] = { 
            sessions: 0, 
            totalEngagement: 0, 
            scores: []
          };
        }
        dailyData[day].sessions++;
        dailyData[day].totalEngagement += engagement;
        dailyData[day].scores.push(engagement);
      });

      // Find optimal hour
      let bestHour = null;
      let bestHourScore = 0;
      let bestHourConsistency = 0;

      Object.keys(hourlyData).forEach(hour => {
        const data = hourlyData[hour];
        if (data.sessions >= 2) {
          const avgEngagement = data.totalEngagement / data.sessions;
          const consistency = this.calculateConsistency(data.scores);
          const compositeScore = avgEngagement * (consistency / 100);

          if (compositeScore > bestHourScore) {
            bestHourScore = compositeScore;
            bestHour = parseInt(hour);
            bestHourConsistency = consistency;
          }
        }
      });

      // Find optimal day
      let bestDay = null;
      let bestDayScore = 0;
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      Object.keys(dailyData).forEach(day => {
        const data = dailyData[day];
        if (data.sessions >= 2) {
          const avgEngagement = data.totalEngagement / data.sessions;
          if (avgEngagement > bestDayScore) {
            bestDayScore = avgEngagement;
            bestDay = parseInt(day);
          }
        }
      });

      // Calculate ideal session length
      const allDurations = sessions.map(s => s.duration).filter(d => d > 0);
      const idealSessionLength = allDurations.length > 0 ? 
        this.calculateOptimalDuration(allDurations, sessions) : 30;

      const confidence = Math.min(sessions.length * 5, 100);

      return {
        type: "optimal_timing",
        bestHour,
        bestDay,
        bestDayName: bestDay !== null ? dayNames[bestDay] : null,
        idealSessionLength: Math.round(idealSessionLength),
        confidence,
        hourlyConsistency: bestHourConsistency,
        insights: this.generateTimingInsights(bestHour, bestDay, idealSessionLength),
        dataPoints: sessions.length
      };

    } catch (error) {
      console.error("Error detecting optimal timing:", error);
      return {
        type: "optimal_timing",
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Detect engagement patterns
   */
  async detectEngagementPatterns(userId) {
    try {
      const analytics = await LearningAnalytics.find({
        user: userId
      }).sort({ "period.startDate": -1 }).limit(12);

      if (analytics.length < 3) {
        return {
          type: "engagement_patterns",
          confidence: 0,
          message: "Need more analytics data to detect engagement patterns"
        };
      }

      const engagementData = analytics.map(a => ({
        date: a.period.startDate,
        focusScore: a.engagement.focusScore,
        sessionCount: a.engagement.sessionCount,
        averageDuration: a.engagement.averageSessionDuration
      }));

      // Detect trends
      const focusScores = engagementData.map(d => d.focusScore);
      const sessionCounts = engagementData.map(d => d.sessionCount);

      const focusTrend = this.calculateTrend(focusScores);
      const sessionTrend = this.calculateTrend(sessionCounts);

      // Detect patterns
      const patterns = [];

      // Consistency pattern
      const focusConsistency = this.calculateConsistency(focusScores);
      if (focusConsistency > 80) {
        patterns.push({
          pattern: "high_consistency",
          description: "Your engagement levels are very consistent",
          strength: focusConsistency
        });
      } else if (focusConsistency < 40) {
        patterns.push({
          pattern: "inconsistent_engagement",
          description: "Your engagement varies significantly",
          strength: 100 - focusConsistency
        });
      }

      // Trend patterns
      if (focusTrend > 0.2) {
        patterns.push({
          pattern: "improving_engagement",
          description: "Your engagement is steadily improving",
          strength: Math.min(focusTrend * 100, 100)
        });
      } else if (focusTrend < -0.2) {
        patterns.push({
          pattern: "declining_engagement",
          description: "Your engagement has been declining",
          strength: Math.min(Math.abs(focusTrend) * 100, 100)
        });
      }

      // Session frequency patterns
      if (sessionTrend > 0.2) {
        patterns.push({
          pattern: "increasing_frequency",
          description: "You're learning more frequently over time",
          strength: Math.min(sessionTrend * 100, 100)
        });
      }

      const confidence = Math.min(analytics.length * 12, 100);

      return {
        type: "engagement_patterns",
        patterns,
        trends: {
          focus: { direction: this.getTrendDirection(focusTrend), strength: Math.abs(focusTrend) },
          sessions: { direction: this.getTrendDirection(sessionTrend), strength: Math.abs(sessionTrend) }
        },
        consistency: {
          focus: focusConsistency,
          sessions: this.calculateConsistency(sessionCounts)
        },
        confidence,
        recommendations: this.generateEngagementRecommendations(patterns, focusTrend)
      };

    } catch (error) {
      console.error("Error detecting engagement patterns:", error);
      return {
        type: "engagement_patterns",
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Detect learning velocity patterns
   */
  async detectLearningVelocity(userId) {
    try {
      const progress = await UserProgress.find({
        user: userId,
        completionStatus: "completed"
      }).sort({ completedAt: 1 }).select("completedAt learningModule learningPath");

      if (progress.length < 3) {
        return {
          type: "learning_velocity",
          confidence: 0,
          message: "Need more completed modules to detect velocity patterns"
        };
      }

      // Calculate velocity over time
      const velocityData = [];
      const windowSize = 7; // 7-day windows

      for (let i = windowSize; i < progress.length; i++) {
        const window = progress.slice(i - windowSize, i);
        const timeSpan = (new Date(window[window.length - 1].completedAt) - 
                         new Date(window[0].completedAt)) / (1000 * 60 * 60 * 24);
        
        if (timeSpan > 0) {
          const velocity = window.length / timeSpan; // modules per day
          velocityData.push({
            date: window[window.length - 1].completedAt,
            velocity: velocity * 7 // convert to modules per week
          });
        }
      }

      if (velocityData.length === 0) {
        return {
          type: "learning_velocity",
          confidence: 0,
          message: "Insufficient time span data for velocity calculation"
        };
      }

      // Analyze velocity trends
      const velocities = velocityData.map(d => d.velocity);
      const avgVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
      const velocityTrend = this.calculateTrend(velocities);
      const velocityConsistency = this.calculateConsistency(velocities);

      // Detect velocity patterns
      const patterns = [];

      if (avgVelocity > 3) {
        patterns.push({
          pattern: "high_velocity",
          description: "You complete modules at a fast pace",
          value: avgVelocity
        });
      } else if (avgVelocity < 1) {
        patterns.push({
          pattern: "low_velocity",
          description: "You take time to thoroughly complete modules",
          value: avgVelocity
        });
      }

      if (velocityConsistency > 75) {
        patterns.push({
          pattern: "consistent_pace",
          description: "Your learning pace is very consistent",
          value: velocityConsistency
        });
      }

      if (velocityTrend > 0.2) {
        patterns.push({
          pattern: "accelerating",
          description: "Your learning pace is accelerating",
          value: velocityTrend
        });
      } else if (velocityTrend < -0.2) {
        patterns.push({
          pattern: "decelerating",
          description: "Your learning pace is slowing down",
          value: Math.abs(velocityTrend)
        });
      }

      const confidence = Math.min(velocityData.length * 15, 100);

      return {
        type: "learning_velocity",
        averageVelocity: Math.round(avgVelocity * 100) / 100,
        velocityTrend: Math.round(velocityTrend * 100) / 100,
        consistency: Math.round(velocityConsistency),
        patterns,
        confidence,
        recommendations: this.generateVelocityRecommendations(avgVelocity, velocityTrend, patterns)
      };

    } catch (error) {
      console.error("Error detecting learning velocity:", error);
      return {
        type: "learning_velocity",
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Detect struggle patterns
   */
  async detectStrugglePatterns(userId) {
    try {
      const progress = await UserProgress.find({
        user: userId
      }).populate("learningModule", "title category difficulty")
        .sort({ createdAt: -1 });

      if (progress.length < 5) {
        return {
          type: "struggle_patterns",
          confidence: 0,
          message: "Need more learning data to detect struggle patterns"
        };
      }

      const struggles = [];

      // Analyze by category
      const categoryData = {};
      progress.forEach(p => {
        const category = p.learningModule.category;
        if (!categoryData[category]) {
          categoryData[category] = {
            total: 0,
            completed: 0,
            scores: [],
            difficulties: []
          };
        }
        
        categoryData[category].total++;
        if (p.completionStatus === "completed") {
          categoryData[category].completed++;
          if (p.finalScore > 0) {
            categoryData[category].scores.push(p.finalScore);
          }
        }
        categoryData[category].difficulties.push(p.learningModule.difficulty);
      });

      // Identify struggling categories
      Object.keys(categoryData).forEach(category => {
        const data = categoryData[category];
        const completionRate = data.completed / data.total;
        const avgScore = data.scores.length > 0 ? 
          data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length : 0;

        if (completionRate < 0.6 || avgScore < 65) {
          struggles.push({
            category,
            type: "category_struggle",
            completionRate: Math.round(completionRate * 100),
            averageScore: Math.round(avgScore),
            severity: this.calculateStruggleSeverity(completionRate, avgScore),
            moduleCount: data.total,
            commonDifficulty: this.getMostCommonElement(data.difficulties)
          });
        }
      });

      // Analyze by difficulty
      const difficultyData = {};
      progress.forEach(p => {
        const difficulty = p.learningModule.difficulty;
        if (!difficultyData[difficulty]) {
          difficultyData[difficulty] = {
            total: 0,
            completed: 0,
            scores: []
          };
        }
        
        difficultyData[difficulty].total++;
        if (p.completionStatus === "completed") {
          difficultyData[difficulty].completed++;
          if (p.finalScore > 0) {
            difficultyData[difficulty].scores.push(p.finalScore);
          }
        }
      });

      // Identify difficulty struggles
      Object.keys(difficultyData).forEach(difficulty => {
        const data = difficultyData[difficulty];
        const completionRate = data.completed / data.total;
        const avgScore = data.scores.length > 0 ? 
          data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length : 0;

        if (completionRate < 0.5 || avgScore < 60) {
          struggles.push({
            difficulty,
            type: "difficulty_struggle",
            completionRate: Math.round(completionRate * 100),
            averageScore: Math.round(avgScore),
            severity: this.calculateStruggleSeverity(completionRate, avgScore),
            moduleCount: data.total
          });
        }
      });

      const confidence = Math.min(progress.length * 8, 100);

      return {
        type: "struggle_patterns",
        struggles,
        overallStruggleLevel: this.calculateOverallStruggleLevel(struggles),
        confidence,
        recommendations: this.generateStruggleRecommendations(struggles)
      };

    } catch (error) {
      console.error("Error detecting struggle patterns:", error);
      return {
        type: "struggle_patterns",
        confidence: 0,
        error: error.message
      };
    }
  }

  // Helper methods

  getDetectionMethods(patternTypes) {
    const allMethods = [
      "detectOptimalTiming",
      "detectEngagementPatterns", 
      "detectLearningVelocity",
      "detectStrugglePatterns"
    ];

    if (patternTypes.includes("all")) {
      return allMethods;
    }

    const methodMap = {
      "optimal_timing": "detectOptimalTiming",
      "engagement_patterns": "detectEngagementPatterns",
      "learning_velocity": "detectLearningVelocity", 
      "struggle_patterns": "detectStrugglePatterns"
    };

    return patternTypes
      .map(type => methodMap[type])
      .filter(method => method && allMethods.includes(method));
  }

  calculateConsistency(values) {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    // Convert to percentage (lower variance = higher consistency)
    const consistencyScore = Math.max(0, 100 - (standardDeviation / mean) * 100);
    return Math.min(100, consistencyScore);
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;

    // Simple linear regression slope
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return 0;

    return (n * sumXY - sumX * sumY) / denominator;
  }

  getTrendDirection(trend) {
    if (trend > 0.1) return "increasing";
    if (trend < -0.1) return "decreasing";
    return "stable";
  }

  calculateOptimalDuration(durations, sessions) {
    // Correlate duration with engagement/completion
    const durationEngagementPairs = sessions
      .filter(s => s.duration && s.engagementScore)
      .map(s => ({ duration: s.duration, engagement: s.engagementScore }));

    if (durationEngagementPairs.length < 3) {
      return durations.reduce((sum, d) => sum + d, 0) / durations.length; // Average
    }

    // Find duration that maximizes engagement
    const sortedByDuration = durationEngagementPairs.sort((a, b) => a.duration - b.duration);
    let bestDuration = sortedByDuration[0].duration;
    let bestEngagement = sortedByDuration[0].engagement;

    sortedByDuration.forEach(pair => {
      if (pair.engagement > bestEngagement) {
        bestEngagement = pair.engagement;
        bestDuration = pair.duration;
      }
    });

    return bestDuration;
  }

  calculateStruggleSeverity(completionRate, avgScore) {
    const completionWeight = 0.6;
    const scoreWeight = 0.4;
    
    const completionPenalty = (1 - completionRate) * 100;
    const scorePenalty = Math.max(0, 70 - avgScore);
    
    const overallSeverity = (completionPenalty * completionWeight) + (scorePenalty * scoreWeight);
    
    if (overallSeverity > 50) return "high";
    if (overallSeverity > 25) return "medium";
    return "low";
  }

  calculateOverallStruggleLevel(struggles) {
    if (struggles.length === 0) return "none";
    
    const highSeverityCount = struggles.filter(s => s.severity === "high").length;
    const mediumSeverityCount = struggles.filter(s => s.severity === "medium").length;
    
    if (highSeverityCount > 0) return "high";
    if (mediumSeverityCount > 1) return "medium";
    return "low";
  }

  getMostCommonElement(array) {
    const counts = {};
    array.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    
    return Object.keys(counts).reduce((most, current) => 
      counts[current] > counts[most] ? current : most
    );
  }

  generateTimingInsights(bestHour, bestDay, idealLength) {
    const insights = [];
    
    if (bestHour !== null) {
      const timeOfDay = bestHour < 12 ? "morning" : bestHour < 17 ? "afternoon" : "evening";
      insights.push(`You perform best during ${timeOfDay} hours around ${bestHour}:00`);
    }
    
    if (idealLength) {
      insights.push(`Your optimal session length is approximately ${idealLength} minutes`);
    }
    
    return insights;
  }

  generateEngagementRecommendations(patterns, trend) {
    const recommendations = [];
    
    patterns.forEach(pattern => {
      switch (pattern.pattern) {
        case "declining_engagement":
          recommendations.push("Consider taking a short break or changing your learning approach");
          break;
        case "inconsistent_engagement":
          recommendations.push("Try to establish a more regular learning schedule");
          break;
        case "improving_engagement":
          recommendations.push("Keep up your current learning strategies - they're working!");
          break;
      }
    });
    
    if (trend < -0.2) {
      recommendations.push("Your engagement is trending down - consider adjusting difficulty or content type");
    }
    
    return recommendations;
  }

  generateVelocityRecommendations(avgVelocity, trend, patterns) {
    const recommendations = [];
    
    if (avgVelocity < 1) {
      recommendations.push("Consider setting aside more dedicated learning time to increase pace");
    } else if (avgVelocity > 4) {
      recommendations.push("You're learning quickly - ensure you're retaining information well");
    }
    
    if (trend < -0.2) {
      recommendations.push("Your learning pace is slowing - check if difficulty or motivation needs adjustment");
    }
    
    return recommendations;
  }

  generateStruggleRecommendations(struggles) {
    const recommendations = [];
    
    struggles.forEach(struggle => {
      if (struggle.type === "category_struggle") {
        recommendations.push(`Focus on strengthening ${struggle.category} fundamentals`);
      } else if (struggle.type === "difficulty_struggle") {
        recommendations.push(`Consider reviewing prerequisites for ${struggle.difficulty} level content`);
      }
    });
    
    return recommendations;
  }

}

const patternDetector = new PatternDetector();
module.exports = { patternDetector };