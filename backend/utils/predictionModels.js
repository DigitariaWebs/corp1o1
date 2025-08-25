// utils/predictionModels.js

class PredictionModels {

  /**
   * Simple time series forecasting using linear regression
   */
  async forecastTimeSeries(data, periods) {
    if (!data || data.length < 3) {
      return {
        forecast: [],
        confidence: "low",
        method: "insufficient_data"
      };
    }

    // Extract values and create time indices
    const values = data.map(d => d.averageScore || d.completionRate || d.value || 0);
    const timeIndices = Array.from({ length: values.length }, (_, i) => i);

    // Calculate linear regression
    const regression = this.linearRegression(timeIndices, values);
    
    // Generate forecast
    const forecast = [];
    const lastTimeIndex = timeIndices[timeIndices.length - 1];
    
    for (let i = 1; i <= periods; i++) {
      const futureTime = lastTimeIndex + i;
      const predictedValue = regression.slope * futureTime + regression.intercept;
      
      // Add some realistic bounds
      const boundedValue = Math.max(0, Math.min(100, predictedValue));
      
      forecast.push({
        period: i,
        predictedValue: Math.round(boundedValue * 100) / 100,
        confidence: this.calculateForecastConfidence(regression.correlation, i),
        upperBound: Math.min(100, boundedValue + regression.standardError),
        lowerBound: Math.max(0, boundedValue - regression.standardError)
      });
    }

    return {
      forecast,
      trend: regression.slope > 0.1 ? "improving" : regression.slope < -0.1 ? "declining" : "stable",
      confidence: this.overallConfidence(regression.correlation, data.length),
      method: "linear_regression",
      regression: {
        slope: Math.round(regression.slope * 1000) / 1000,
        intercept: Math.round(regression.intercept * 100) / 100,
        correlation: Math.round(regression.correlation * 100) / 100
      }
    };
  }

  /**
   * Forecast engagement patterns
   */
  async forecastEngagement(engagementData, days) {
    if (!engagementData || engagementData.length < 7) {
      return {
        forecast: [],
        confidence: "low",
        method: "insufficient_data"
      };
    }

    // Analyze weekly patterns
    const weeklyPatterns = this.analyzeWeeklyPatterns(engagementData);
    
    // Analyze daily engagement trends
    const sessionCounts = engagementData.map(d => d.sessionCount || 0);
    const focusScores = engagementData.map(d => d.focusScore || 70);
    
    const sessionTrend = this.linearRegression(
      Array.from({ length: sessionCounts.length }, (_, i) => i),
      sessionCounts
    );
    
    const focusTrend = this.linearRegression(
      Array.from({ length: focusScores.length }, (_, i) => i),
      focusScores
    );

    // Generate forecast
    const forecast = [];
    for (let i = 1; i <= days; i++) {
      const dayOfWeek = (new Date().getDay() + i) % 7;
      const weeklyFactor = weeklyPatterns.factors[dayOfWeek] || 1;
      
      const baseSessions = sessionTrend.slope * (sessionCounts.length + i) + sessionTrend.intercept;
      const baseFocus = focusTrend.slope * (focusScores.length + i) + focusTrend.intercept;
      
      const predictedSessions = Math.max(0, baseSessions * weeklyFactor);
      const predictedFocus = Math.max(0, Math.min(100, baseFocus * weeklyFactor));
      
      forecast.push({
        day: i,
        dayOfWeek,
        predictedSessions: Math.round(predictedSessions * 10) / 10,
        predictedFocus: Math.round(predictedFocus),
        engagementLevel: this.categorizeEngagement(predictedSessions, predictedFocus),
        confidence: this.calculateEngagementConfidence(i, sessionTrend.correlation, focusTrend.correlation)
      });
    }

    // Identify optimal days and risk periods
    const optimalDays = forecast
      .filter(f => f.engagementLevel === "high")
      .map(f => f.dayOfWeek);
    
    const riskDays = forecast
      .filter(f => f.engagementLevel === "low")
      .map(f => f.dayOfWeek);

    return {
      forecast,
      optimalDays: [...new Set(optimalDays)],
      riskLevel: this.calculateEngagementRisk(forecast),
      interventions: this.suggestEngagementInterventions(forecast, weeklyPatterns),
      weeklyPatterns,
      confidence: this.overallConfidence(
        (sessionTrend.correlation + focusTrend.correlation) / 2, 
        engagementData.length
      )
    };
  }

  /**
   * Predict completion likelihood using logistic regression approach
   */
  predictCompletionLikelihood(userMetrics) {
    // Simple logistic model based on key factors
    const {
      completionRate = 0,
      averageScore = 0,
      engagementScore = 0,
      learningVelocity = 0,
      timeSpent = 0,
      consistencyScore = 0
    } = userMetrics;

    // Normalize inputs (0-1 scale)
    const normalizedInputs = {
      completion: completionRate / 100,
      score: averageScore / 100,
      engagement: engagementScore / 100,
      velocity: Math.min(learningVelocity / 3, 1), // Normalize velocity (3 modules/week = 1.0)
      time: Math.min(timeSpent / 60, 1), // Normalize time (60 hours = 1.0)
      consistency: consistencyScore / 100
    };

    // Weighted logistic model
    const weights = {
      completion: 0.25,
      score: 0.20,
      engagement: 0.20,
      velocity: 0.15,
      time: 0.10,
      consistency: 0.10
    };

    const weightedSum = Object.keys(weights).reduce((sum, key) => {
      return sum + (normalizedInputs[key] * weights[key]);
    }, 0);

    // Apply logistic function
    const probability = 1 / (1 + Math.exp(-6 * (weightedSum - 0.5)));

    return {
      probability: Math.round(probability * 100),
      confidence: this.calculateModelConfidence(normalizedInputs),
      factors: this.identifyKeyFactors(normalizedInputs, weights),
      recommendation: this.generateCompletionRecommendation(probability, normalizedInputs)
    };
  }

  /**
   * Predict optimal next module based on user patterns
   */
  predictOptimalNextModule(userHistory, availableModules) {
    if (!userHistory || userHistory.length === 0 || !availableModules || availableModules.length === 0) {
      return {
        recommendations: [],
        confidence: 0,
        method: "insufficient_data"
      };
    }

    const recommendations = [];

    // Analyze user preferences from history
    const categoryPreferences = this.analyzeCategoryPreferences(userHistory);
    const difficultyProgression = this.analyzeDifficultyProgression(userHistory);
    const timePreferences = this.analyzeTimePreferences(userHistory);

    // Score each available module
    availableModules.forEach(module => {
      const score = this.scoreModuleForUser(module, {
        categoryPreferences,
        difficultyProgression,
        timePreferences,
        userHistory
      });

      recommendations.push({
        moduleId: module._id,
        title: module.title,
        category: module.category,
        difficulty: module.difficulty,
        score: Math.round(score * 100) / 100,
        reasons: score.reasons || [],
        estimatedCompletionTime: this.estimateCompletionTime(module, userHistory)
      });
    });

    // Sort by score and return top recommendations
    recommendations.sort((a, b) => b.score - a.score);

    return {
      recommendations: recommendations.slice(0, 5),
      confidence: this.calculateRecommendationConfidence(userHistory.length),
      method: "collaborative_preference_analysis"
    };
  }

  // Helper methods for regression and statistics

  linearRegression(x, y) {
    if (x.length !== y.length || x.length === 0) {
      return { slope: 0, intercept: 0, correlation: 0, standardError: 0 };
    }

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) {
      return { slope: 0, intercept: sumY / n, correlation: 0, standardError: 0 };
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    // Calculate correlation coefficient
    const numeratorCorr = n * sumXY - sumX * sumY;
    const denominatorCorr = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const correlation = denominatorCorr === 0 ? 0 : numeratorCorr / denominatorCorr;

    // Calculate standard error
    const residuals = y.map((val, i) => val - (slope * x[i] + intercept));
    const mse = residuals.reduce((sum, val) => sum + val * val, 0) / (n - 2);
    const standardError = Math.sqrt(mse);

    return { slope, intercept, correlation, standardError };
  }

  calculateForecastConfidence(correlation, periodsAhead) {
    // Confidence decreases with distance and low correlation
    const baseConfidence = Math.abs(correlation) * 100;
    const distancePenalty = Math.max(0, periodsAhead - 1) * 5;
    return Math.max(0, Math.min(100, baseConfidence - distancePenalty));
  }

  overallConfidence(correlation, dataPoints) {
    const correlationScore = Math.abs(correlation) * 60;
    const dataScore = Math.min(dataPoints * 5, 40);
    return Math.round(correlationScore + dataScore);
  }

  analyzeWeeklyPatterns(engagementData) {
    const dayData = {};
    
    // Initialize days
    for (let i = 0; i < 7; i++) {
      dayData[i] = { sessions: [], focus: [] };
    }

    // Group data by day of week
    engagementData.forEach(d => {
      const dayOfWeek = new Date(d.date).getDay();
      dayData[dayOfWeek].sessions.push(d.sessionCount || 0);
      dayData[dayOfWeek].focus.push(d.focusScore || 70);
    });

    // Calculate average for each day
    const dayAverages = {};
    const factors = {};
    let overallAvg = 0;
    let dayCount = 0;

    Object.keys(dayData).forEach(day => {
      const sessionAvg = dayData[day].sessions.length > 0 ? 
        dayData[day].sessions.reduce((sum, s) => sum + s, 0) / dayData[day].sessions.length : 0;
      const focusAvg = dayData[day].focus.length > 0 ?
        dayData[day].focus.reduce((sum, f) => sum + f, 0) / dayData[day].focus.length : 70;
      
      dayAverages[day] = { sessions: sessionAvg, focus: focusAvg };
      overallAvg += sessionAvg;
      dayCount++;
    });

    overallAvg = overallAvg / dayCount;

    // Calculate relative factors
    Object.keys(dayAverages).forEach(day => {
      factors[day] = overallAvg > 0 ? dayAverages[day].sessions / overallAvg : 1;
    });

    return { dayAverages, factors };
  }

  categorizeEngagement(sessions, focus) {
    if (sessions >= 2 && focus >= 70) return "high";
    if (sessions >= 1 && focus >= 50) return "medium";
    return "low";
  }

  calculateEngagementConfidence(daysAhead, sessionCorr, focusCorr) {
    const avgCorr = (Math.abs(sessionCorr) + Math.abs(focusCorr)) / 2;
    const baseConfidence = avgCorr * 80;
    const timePenalty = daysAhead * 2;
    return Math.max(20, Math.min(100, baseConfidence - timePenalty));
  }

  calculateEngagementRisk(forecast) {
    const lowEngagementDays = forecast.filter(f => f.engagementLevel === "low").length;
    const totalDays = forecast.length;
    const riskRatio = lowEngagementDays / totalDays;

    if (riskRatio > 0.4) return "high";
    if (riskRatio > 0.2) return "medium";
    return "low";
  }

  suggestEngagementInterventions(forecast, patterns) {
    const interventions = [];
    
    const lowDays = forecast.filter(f => f.engagementLevel === "low");
    if (lowDays.length > 0) {
      interventions.push({
        type: "schedule_adjustment",
        description: "Consider rescheduling learning sessions away from predicted low-engagement days",
        targetDays: lowDays.map(d => d.dayOfWeek)
      });
    }

    const consistentlyLow = Object.keys(patterns.dayAverages).filter(day => 
      patterns.dayAverages[day].sessions < 1
    );
    
    if (consistentlyLow.length > 0) {
      interventions.push({
        type: "motivation_boost",
        description: "Schedule motivational content or rewards for historically low-activity days",
        targetDays: consistentlyLow.map(d => parseInt(d))
      });
    }

    return interventions;
  }

  calculateModelConfidence(inputs) {
    // Confidence based on how many factors are positive indicators
    const positiveFactors = Object.values(inputs).filter(val => val > 0.6).length;
    const totalFactors = Object.keys(inputs).length;
    return Math.round((positiveFactors / totalFactors) * 100);
  }

  identifyKeyFactors(inputs, weights) {
    const factors = Object.keys(inputs).map(key => ({
      factor: key,
      value: inputs[key],
      weight: weights[key],
      impact: inputs[key] * weights[key]
    }));

    return factors
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 3)
      .map(f => ({
        factor: f.factor,
        impact: Math.round(f.impact * 100),
        status: f.value > 0.6 ? "strong" : f.value > 0.3 ? "moderate" : "weak"
      }));
  }

  generateCompletionRecommendation(probability, inputs) {
    if (probability > 0.8) {
      return "High likelihood of completion - maintain current approach";
    } else if (probability > 0.6) {
      return "Good completion prospects - consider small optimizations";
    } else if (probability > 0.4) {
      const weakestArea = Object.keys(inputs).reduce((worst, key) => 
        inputs[key] < inputs[worst] ? key : worst
      );
      return `Moderate risk - focus on improving ${weakestArea}`;
    } else {
      return "High risk of non-completion - significant intervention needed";
    }
  }

  // Additional helper methods for module recommendations

  analyzeCategoryPreferences(history) {
    const categoryScores = {};
    history.forEach(item => {
      const category = item.category || item.learningModule?.category;
      if (category) {
        if (!categoryScores[category]) {
          categoryScores[category] = { total: 0, scores: [], count: 0 };
        }
        categoryScores[category].count++;
        if (item.finalScore > 0) {
          categoryScores[category].scores.push(item.finalScore);
          categoryScores[category].total += item.finalScore;
        }
      }
    });

    // Calculate average scores and engagement
    Object.keys(categoryScores).forEach(category => {
      const data = categoryScores[category];
      data.average = data.scores.length > 0 ? data.total / data.scores.length : 0;
      data.engagement = data.count; // Number of modules attempted
    });

    return categoryScores;
  }

  analyzeDifficultyProgression(history) {
    const difficultyMap = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const completedLevels = history
      .filter(item => item.completionStatus === "completed")
      .map(item => difficultyMap[item.difficulty] || 1);

    const maxCompleted = Math.max(...completedLevels, 0);
    const recommendedLevel = Math.min(maxCompleted + 1, 4);

    return {
      currentLevel: maxCompleted,
      recommendedLevel,
      readyForAdvancement: maxCompleted > 0
    };
  }

  analyzeTimePreferences(history) {
    const durations = history
      .filter(item => item.estimatedDuration)
      .map(item => item.estimatedDuration);

    if (durations.length === 0) {
      return { preferredDuration: 30, flexibility: "medium" };
    }

    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length;
    
    return {
      preferredDuration: Math.round(avgDuration),
      flexibility: variance < 100 ? "low" : variance > 400 ? "high" : "medium"
    };
  }

  scoreModuleForUser(module, userContext) {
    let score = 0;
    const reasons = [];

    // Category preference scoring
    const categoryPref = userContext.categoryPreferences[module.category];
    if (categoryPref) {
      const categoryScore = (categoryPref.average / 100) * 0.3 + (categoryPref.engagement / 10) * 0.2;
      score += Math.min(categoryScore, 0.5);
      if (categoryPref.average > 75) {
        reasons.push(`Strong performance in ${module.category}`);
      }
    }

    // Difficulty progression scoring
    const difficultyMap = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const moduleDifficulty = difficultyMap[module.difficulty];
    const userLevel = userContext.difficultyProgression.currentLevel;
    
    if (moduleDifficulty === userLevel + 1) {
      score += 0.3; // Perfect next step
      reasons.push("Appropriate difficulty progression");
    } else if (moduleDifficulty === userLevel) {
      score += 0.2; // Reinforcement
      reasons.push("Reinforces current skill level");
    } else if (moduleDifficulty < userLevel) {
      score += 0.1; // Review
    } else {
      score -= 0.2; // Too challenging
    }

    // Time preference scoring
    const timeDiff = Math.abs(module.estimatedDuration - userContext.timePreferences.preferredDuration);
    if (timeDiff < 10) {
      score += 0.2;
      reasons.push("Matches preferred session length");
    }

    return Math.max(0, Math.min(1, score));
  }

  estimateCompletionTime(module, userHistory) {
    const baseTime = module.estimatedDuration || 30;
    
    // Adjust based on user's historical performance
    const userVelocity = this.calculateUserVelocity(userHistory);
    const adjustmentFactor = userVelocity > 1 ? 0.8 : userVelocity < 0.5 ? 1.5 : 1;
    
    return Math.round(baseTime * adjustmentFactor);
  }

  calculateUserVelocity(history) {
    if (history.length === 0) return 1;
    
    const completedModules = history.filter(h => h.completionStatus === "completed");
    const totalTime = history.reduce((sum, h) => sum + (h.timeSpent || 30), 0);
    
    return completedModules.length > 0 ? (completedModules.length / totalTime) * 30 : 1;
  }

  calculateRecommendationConfidence(historyLength) {
    return Math.min(historyLength * 10, 95);
  }

}

const predictionModels = new PredictionModels();
module.exports = { predictionModels };