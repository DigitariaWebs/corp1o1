// services/aiEvaluationService.js
const { openAIService } = require('./openaiService');
const { AppError } = require('../middleware/errorHandler');

/**
 * Advanced OpenAI-powered evaluation service for educational assessments
 * Features: Personalized prompts, confidence scoring, adaptive difficulty, career guidance
 * Based on latest OpenAI best practices for educational evaluation (2025)
 */
class AIEvaluationService {
  constructor() {
    this.provider = 'openai';
    this.models = {
      evaluation: process.env.OPENAI_EVALUATION_MODEL || 'gpt-4o',
      analysis: process.env.OPENAI_ANALYSIS_MODEL || 'gpt-4o-mini',
      recommendations: process.env.OPENAI_RECOMMENDATIONS_MODEL || 'gpt-4o'
    };
    
    // Advanced evaluation settings
    this.settings = {
      temperature: 0.1, // Low temperature for consistent evaluation
      maxTokens: 1500,
      enableLogprobs: true, // For confidence scoring
      topLogprobs: 5, // Number of token alternatives for confidence calculation
      presencePenalty: 0.1,
      frequencyPenalty: 0.1
    };

    // Skill categories with specialized evaluation criteria
    this.skillCategories = {
      programming: {
        criteria: ['code_correctness', 'best_practices', 'problem_solving', 'efficiency', 'documentation'],
        weights: { correctness: 0.4, quality: 0.25, logic: 0.2, efficiency: 0.15 }
      },
      design: {
        criteria: ['creativity', 'usability', 'aesthetics', 'user_experience', 'technical_feasibility'],
        weights: { creativity: 0.3, usability: 0.25, aesthetics: 0.2, ux: 0.15, technical: 0.1 }
      },
      communication: {
        criteria: ['clarity', 'structure', 'persuasiveness', 'audience_awareness', 'professional_tone'],
        weights: { clarity: 0.3, structure: 0.25, persuasion: 0.2, audience: 0.15, tone: 0.1 }
      },
      leadership: {
        criteria: ['decision_making', 'team_management', 'strategic_thinking', 'conflict_resolution', 'motivation'],
        weights: { decisions: 0.25, management: 0.25, strategy: 0.2, conflict: 0.15, motivation: 0.15 }
      },
      analytics: {
        criteria: ['data_interpretation', 'statistical_accuracy', 'visualization', 'insights', 'methodology'],
        weights: { interpretation: 0.3, accuracy: 0.25, visualization: 0.2, insights: 0.15, methodology: 0.1 }
      }
    };
  }

  /**
   * Evaluate an answer using advanced OpenAI assessment
   * @param {Object} question - Question object from database
   * @param {*} answer - User's answer
   * @param {Object} context - Additional evaluation context (user profile, session data, etc.)
   * @returns {Promise<Object>} Comprehensive evaluation result with confidence scoring
   */
  async evaluateAnswer(question, answer, context = {}) {
    try {
      console.log(`🤖 OpenAI evaluating ${question.type} question: ${question.questionId}`);

      if (!question.aiConfig?.enabled) {
        throw new AppError('AI evaluation not enabled for this question', 400);
      }

      // Prepare comprehensive evaluation context with user personalization
      const evaluationContext = {
        question,
        answer,
        maxPoints: context.maxPoints || question.scoring?.points || 10,
        timeSpent: context.timeSpent || 0,
        difficulty: question.difficulty,
        questionType: question.type,
        skillCategory: question.category || 'general',
        userProfile: context.userProfile || {},
        assessmentHistory: context.assessmentHistory || [],
        learningStyle: context.learningStyle || 'adaptive',
        careerGoals: context.careerGoals || [],
        previousAttempts: context.previousAttempts || 0,
        ...context
      };

      // Generate personalized prompts based on context
      const { systemPrompt, evaluationPrompt } = this.generatePersonalizedPrompts(evaluationContext);

      // Perform OpenAI evaluation with confidence scoring
      const result = await this.evaluateWithAdvancedOpenAI(systemPrompt, evaluationPrompt, evaluationContext);

      // Add adaptive difficulty and career recommendations
      const enhancedResult = await this.enhanceWithAdaptiveInsights(result, evaluationContext);

      return this.normalizeEvaluationResult(enhancedResult, evaluationContext);

    } catch (error) {
      console.error('❌ OpenAI evaluation failed:', error);
      
      // Return detailed fallback evaluation
      return this.createFallbackEvaluation(error, question, context);
    }
  }

  /**
   * Generate personalized prompts based on user context and question type
   * @param {Object} context - Full evaluation context
   * @returns {Object} Generated system and evaluation prompts
   */
  generatePersonalizedPrompts(context) {
    const { question, userProfile, skillCategory, assessmentHistory, careerGoals, learningStyle } = context;
    
    // Base system prompt with educational evaluation expertise
    let systemPrompt = `You are an expert educational AI evaluator specializing in ${skillCategory} assessments. You have deep expertise in pedagogy, assessment theory, and personalized learning.

CORE RESPONSIBILITIES:
1. Provide fair, objective, and constructive evaluation
2. Adapt feedback to the learner's profile and goals
3. Generate confidence scores based on response quality
4. Identify learning patterns and recommend next steps
5. Support career development through targeted insights

EVALUATION PHILOSOPHY:
- Focus on learning and growth, not just correctness
- Provide specific, actionable feedback
- Consider partial credit and learning progression
- Identify both strengths and improvement areas
- Maintain high standards while being encouraging

RESPONSE FORMAT: Always respond with valid JSON using the specified schema.`;

    // Add skill-category specific expertise
    if (this.skillCategories[skillCategory]) {
      const categoryInfo = this.skillCategories[skillCategory];
      systemPrompt += `\n\nSPECIALIZATION - ${skillCategory.toUpperCase()} ASSESSMENT:
Evaluation Criteria: ${categoryInfo.criteria.join(', ')}
Weighting: ${Object.entries(categoryInfo.weights).map(([k, v]) => `${k}: ${Math.round(v*100)}%`).join(', ')}`;
    }

    // Add user personalization
    if (userProfile.experienceLevel) {
      systemPrompt += `\n\nLEARNER PROFILE:
Experience Level: ${userProfile.experienceLevel}
Learning Style: ${learningStyle}`;
    }

    if (careerGoals.length > 0) {
      systemPrompt += `\nCareer Goals: ${careerGoals.join(', ')}`;
    }

    if (assessmentHistory.length > 0) {
      const avgScore = assessmentHistory.reduce((sum, h) => sum + h.score, 0) / assessmentHistory.length;
      systemPrompt += `\nHistorical Performance: ${Math.round(avgScore * 100)}% average (${assessmentHistory.length} assessments)`;
    }

    // Generate evaluation prompt with context
    const evaluationPrompt = this.buildAdvancedEvaluationPrompt(context);

    return { systemPrompt, evaluationPrompt };
  }

  /**
   * Advanced OpenAI evaluation with confidence scoring using logprobs
   * @param {string} systemPrompt - Personalized system prompt
   * @param {string} evaluationPrompt - Detailed evaluation prompt
   * @param {Object} context - Evaluation context
   * @returns {Promise<Object>} Evaluation result with confidence scores
   */
  async evaluateWithAdvancedOpenAI(systemPrompt, evaluationPrompt, context) {
    const { question } = context;
    
    try {
      // Make OpenAI API call with logprobs for confidence scoring
      const response = await openAIService.createChatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: evaluationPrompt }
      ], {
        model: question.aiConfig?.model || this.models.evaluation,
        temperature: this.settings.temperature,
        max_tokens: this.settings.maxTokens,
        logprobs: this.settings.enableLogprobs,
        top_logprobs: this.settings.topLogprobs,
        presence_penalty: this.settings.presencePenalty,
        frequency_penalty: this.settings.frequencyPenalty,
        response_format: { type: "json_object" } // Structured output
      });

      // Parse structured response
      const evaluation = this.parseStructuredResponse(response.content);
      
      // Calculate confidence score using logprobs
      const confidenceScore = this.calculateConfidenceFromLogprobs(response.logprobs);
      
      return {
        ...evaluation,
        confidence: confidenceScore,
        provider: 'openai',
        model: question.aiConfig?.model || this.models.evaluation,
        evaluatedAt: new Date(),
        logprobsConfidence: confidenceScore,
        rawLogprobs: response.logprobs // For debugging/analysis
      };

    } catch (error) {
      console.error('Advanced OpenAI evaluation failed:', error);
      throw new AppError(`OpenAI evaluation failed: ${error.message}`, 500);
    }
  }

  /**
   * Build advanced evaluation prompt with comprehensive context
   * @param {Object} context - Full evaluation context
   * @returns {string} Detailed evaluation prompt
   */
  buildAdvancedEvaluationPrompt(context) {
    const { question, answer, maxPoints, timeSpent, skillCategory, userProfile, previousAttempts } = context;

    // Base question information
    let prompt = `ASSESSMENT DETAILS:
Question Type: ${question.type}
Skill Category: ${skillCategory}
Difficulty Level: ${question.difficulty}
Maximum Points: ${maxPoints}
Time Spent: ${timeSpent} seconds
Previous Attempts: ${previousAttempts}

QUESTION:
${question.question}`;

    // Add question-specific context
    if (question.description) {
      prompt += `\n\nDESCRIPTION:
${question.description}`;
    }

    if (question.correctAnswer) {
      prompt += `\n\nCORRECT ANSWER REFERENCE:
${typeof question.correctAnswer === 'object' ? JSON.stringify(question.correctAnswer) : question.correctAnswer}`;
    }

    // Add user's answer
    prompt += `\n\nSTUDENT RESPONSE:
${typeof answer === 'object' ? JSON.stringify(answer, null, 2) : answer}`;

    // Add personalized evaluation criteria
    prompt += this.getPersonalizedEvaluationCriteria(context);

    // Add structured output schema
    prompt += `\n\nEVALUATION OUTPUT SCHEMA:
Provide your evaluation as a JSON object with this exact structure:
{
  "score": <number 0.0-1.0>,
  "pointsEarned": <number 0-${maxPoints}>,
  "percentage": <number 0-100>,
  "feedback": "<comprehensive feedback explaining the score>",
  "strengths": ["<specific strengths identified>"],
  "improvements": ["<specific areas for improvement>"],
  "keyPointsIdentified": ["<key concepts correctly addressed>"],
  "keyPointsMissed": ["<important concepts not addressed>"],
  "skillLevelDemonstrated": "<beginner|intermediate|advanced|expert>",
  "learningRecommendations": ["<personalized next steps>"],
  "careerRelevance": "<how this relates to career goals>",
  "conceptualUnderstanding": <number 0-100>,
  "practicalApplication": <number 0-100>,
  "confidenceIndicators": ["<factors indicating response confidence>"],
  "requiresHumanReview": <boolean>,
  "adaptiveDifficultyRecommendation": "<easier|same|harder>",
  "estimatedStudyTime": "<hours needed to improve>",
  "relatedTopics": ["<topics to study next>"],
  "industryApplications": ["<real-world applications>"]
}`;

    return prompt;
  }

  /**
   * Get personalized evaluation criteria based on user context
   * @param {Object} context - Evaluation context
   * @returns {string} Personalized criteria
   */
  getPersonalizedEvaluationCriteria(context) {
    const { question, skillCategory, userProfile, careerGoals, learningStyle } = context;
    
    let criteria = `\n\nPERSONALIZED EVALUATION CRITERIA:`;

    // Skill-specific criteria
    if (this.skillCategories[skillCategory]) {
      const categoryInfo = this.skillCategories[skillCategory];
      criteria += `\n\nFocus Areas for ${skillCategory}:`;
      categoryInfo.criteria.forEach(criterion => {
        criteria += `\n- ${criterion.replace('_', ' ')}: Evaluate depth and application`;
      });
    }

    // Learning style adaptations
    if (learningStyle === 'visual') {
      criteria += `\n\nNote: This learner prefers visual explanations. Look for diagrams, charts, or visual thinking in the response.`;
    } else if (learningStyle === 'practical') {
      criteria += `\n\nNote: This learner prefers hands-on examples. Look for practical applications and real-world connections.`;
    } else if (learningStyle === 'theoretical') {
      criteria += `\n\nNote: This learner prefers conceptual understanding. Look for theoretical knowledge and abstract reasoning.`;
    }

    // Career goal alignment
    if (careerGoals.length > 0) {
      criteria += `\n\nCareer Alignment: Consider how this response demonstrates skills relevant to: ${careerGoals.join(', ')}`;
    }

    // Experience level considerations
    if (userProfile.experienceLevel === 'beginner') {
      criteria += `\n\nBeginner Considerations: Focus on foundational understanding, encourage effort, provide clear next steps.`;
    } else if (userProfile.experienceLevel === 'advanced') {
      criteria += `\n\nAdvanced Considerations: Look for nuanced understanding, innovative approaches, industry best practices.`;
    }

    return criteria;
  }

  /**
   * Calculate confidence score from OpenAI logprobs
   * @param {Object} logprobs - Logprobs from OpenAI response
   * @returns {number} Confidence score (0-100)
   */
  calculateConfidenceFromLogprobs(logprobs) {
    if (!logprobs || !logprobs.content) {
      return 75; // Default confidence when logprobs unavailable
    }

    try {
      // Extract token logprobs
      const tokenLogprobs = logprobs.content.map(token => token.logprob);
      
      // Calculate average logprob (more negative = less confident)
      const avgLogprob = tokenLogprobs.reduce((sum, logprob) => sum + logprob, 0) / tokenLogprobs.length;
      
      // Convert to probability and then to percentage
      // logprob of 0 = 100% confidence, logprob of -5 = ~1% confidence
      const probability = Math.exp(avgLogprob);
      const confidenceScore = Math.min(100, Math.max(10, probability * 100));
      
      // Additional confidence factors
      const tokenVariance = this.calculateTokenVariance(tokenLogprobs);
      const lengthFactor = Math.min(1, tokenLogprobs.length / 50); // Longer responses generally more confident
      
      // Adjust confidence based on variance (high variance = less confidence)
      const varianceAdjustment = Math.max(0.7, 1 - (tokenVariance * 0.3));
      
      const finalConfidence = Math.round(confidenceScore * varianceAdjustment * lengthFactor);
      
      console.log(`🎯 Confidence calculation: avgLogprob=${avgLogprob.toFixed(3)}, variance=${tokenVariance.toFixed(3)}, final=${finalConfidence}%`);
      
      return Math.max(10, Math.min(100, finalConfidence));
      
    } catch (error) {
      console.error('Error calculating confidence from logprobs:', error);
      return 60; // Fallback confidence
    }
  }

  /**
   * Calculate variance in token logprobs for confidence assessment
   * @param {Array} logprobs - Array of token logprobs
   * @returns {number} Variance value
   */
  calculateTokenVariance(logprobs) {
    if (logprobs.length < 2) return 0;
    
    const mean = logprobs.reduce((sum, val) => sum + val, 0) / logprobs.length;
    const variance = logprobs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / logprobs.length;
    
    return variance;
  }

  /**
   * Parse structured OpenAI response
   * @param {string} response - Raw JSON response from OpenAI
   * @returns {Object} Parsed evaluation data
   */
  parseStructuredResponse(response) {
    try {
      // Clean and parse JSON response
      const cleaned = response.trim();
      const evaluation = JSON.parse(cleaned);

      // Validate and normalize the structured response
      return {
        score: this.validateScore(evaluation.score),
        pointsEarned: evaluation.pointsEarned || 0,
        percentage: evaluation.percentage || Math.round((evaluation.score || 0) * 100),
        feedback: evaluation.feedback || 'No feedback provided',
        strengths: evaluation.strengths || [],
        improvements: evaluation.improvements || [],
        keyPointsIdentified: evaluation.keyPointsIdentified || [],
        keyPointsMissed: evaluation.keyPointsMissed || [],
        skillLevelDemonstrated: evaluation.skillLevelDemonstrated || 'intermediate',
        learningRecommendations: evaluation.learningRecommendations || [],
        careerRelevance: evaluation.careerRelevance || 'General skill development',
        conceptualUnderstanding: Math.max(0, Math.min(100, evaluation.conceptualUnderstanding || 70)),
        practicalApplication: Math.max(0, Math.min(100, evaluation.practicalApplication || 70)),
        confidenceIndicators: evaluation.confidenceIndicators || [],
        requiresHumanReview: evaluation.requiresHumanReview || false,
        adaptiveDifficultyRecommendation: evaluation.adaptiveDifficultyRecommendation || 'same',
        estimatedStudyTime: evaluation.estimatedStudyTime || '2-4 hours',
        relatedTopics: evaluation.relatedTopics || [],
        industryApplications: evaluation.industryApplications || []
      };

    } catch (error) {
      console.error('Failed to parse structured OpenAI response:', error);
      console.error('Raw response:', response);

      // Return fallback structured response
      return {
        score: 0,
        pointsEarned: 0,
        percentage: 0,
        feedback: 'Response parsing failed - requires manual review',
        strengths: [],
        improvements: ['Response requires manual evaluation'],
        keyPointsIdentified: [],
        keyPointsMissed: [],
        skillLevelDemonstrated: 'unknown',
        learningRecommendations: ['Seek instructor feedback'],
        careerRelevance: 'Manual review needed',
        conceptualUnderstanding: 0,
        practicalApplication: 0,
        confidenceIndicators: ['Parse error occurred'],
        requiresHumanReview: true,
        adaptiveDifficultyRecommendation: 'same',
        estimatedStudyTime: 'Unknown',
        relatedTopics: [],
        industryApplications: []
      };
    }
  }

  /**
   * Enhance evaluation result with adaptive insights and career guidance
   * @param {Object} result - Base evaluation result
   * @param {Object} context - Full evaluation context
   * @returns {Promise<Object>} Enhanced result with adaptive recommendations
   */
  async enhanceWithAdaptiveInsights(result, context) {
    try {
      const { question, userProfile, assessmentHistory, careerGoals } = context;
      
      // Generate adaptive difficulty recommendation
      const adaptiveRecommendation = this.calculateAdaptiveDifficulty(result, context);
      
      // Generate career-specific insights
      const careerInsights = await this.generateCareerInsights(result, context);
      
      // Calculate learning progression
      const learningProgression = this.analyzeLearningProgression(result, assessmentHistory);
      
      return {
        ...result,
        adaptiveInsights: {
          recommendedDifficulty: adaptiveRecommendation,
          skillProgression: learningProgression,
          careerAlignment: careerInsights,
          nextSteps: this.generatePersonalizedNextSteps(result, context),
          studyPlan: this.generateStudyPlan(result, context)
        }
      };
      
    } catch (error) {
      console.error('Error enhancing with adaptive insights:', error);
      return result; // Return base result if enhancement fails
    }
  }

  /**
   * Calculate adaptive difficulty recommendation
   * @param {Object} result - Evaluation result
   * @param {Object} context - Evaluation context
   * @returns {string} Difficulty recommendation
   */
  calculateAdaptiveDifficulty(result, context) {
    const { score, conceptualUnderstanding, practicalApplication } = result;
    const { timeSpent, question, previousAttempts } = context;
    
    const avgScore = (conceptualUnderstanding + practicalApplication) / 200; // Normalize to 0-1
    const timeEfficiency = Math.min(1, question.estimatedTimeMinutes * 60 / timeSpent);
    const overallPerformance = (score + avgScore + timeEfficiency) / 3;
    
    // Adaptive logic
    if (overallPerformance >= 0.85 && previousAttempts === 0) {
      return 'harder'; // Excelling, increase challenge
    } else if (overallPerformance <= 0.4 || previousAttempts >= 2) {
      return 'easier'; // Struggling, reduce difficulty
    } else {
      return 'same'; // Appropriate level
    }
  }

  /**
   * Generate career-specific insights
   * @param {Object} result - Evaluation result
   * @param {Object} context - Evaluation context
   * @returns {Promise<Object>} Career insights
   */
  async generateCareerInsights(result, context) {
    const { careerGoals, skillCategory } = context;
    
    if (careerGoals.length === 0) {
      return {
        relevance: 'general',
        applications: ['General skill development'],
        careerImpact: 'Builds foundational competencies'
      };
    }

    // Map skills to career relevance
    const careerMapping = {
      'software_engineer': ['programming', 'analytics', 'problem_solving'],
      'data_scientist': ['analytics', 'programming', 'communication'],
      'product_manager': ['communication', 'leadership', 'analytics'],
      'designer': ['design', 'communication', 'creativity'],
      'marketing_manager': ['communication', 'analytics', 'creativity']
    };

    const relevantCareers = careerGoals.filter(goal => 
      careerMapping[goal]?.includes(skillCategory)
    );

    return {
      relevance: relevantCareers.length > 0 ? 'high' : 'medium',
      applications: this.getCareerApplications(skillCategory, careerGoals),
      careerImpact: this.assessCareerImpact(result.score, skillCategory, careerGoals),
      industryDemand: this.getIndustryDemand(skillCategory)
    };
  }

  /**
   * Analyze learning progression based on history
   * @param {Object} result - Current evaluation result
   * @param {Array} history - Assessment history
   * @returns {Object} Learning progression analysis
   */
  analyzeLearningProgression(result, history) {
    if (history.length === 0) {
      return {
        trend: 'first_attempt',
        improvement: 0,
        consistency: 0,
        recommendation: 'Establish baseline performance'
      };
    }

    const recentScores = history.slice(-5).map(h => h.score);
    const currentScore = result.score;
    
    // Calculate trend
    const avgImprovement = recentScores.length > 1 ? 
      (currentScore - recentScores[0]) / recentScores.length : 0;
    
    // Calculate consistency (lower variance = more consistent)
    const variance = this.calculateVariance(recentScores);
    const consistency = Math.max(0, 100 - (variance * 100));
    
    let trend = 'stable';
    if (avgImprovement > 0.1) trend = 'improving';
    else if (avgImprovement < -0.1) trend = 'declining';
    
    return {
      trend,
      improvement: Math.round(avgImprovement * 100),
      consistency: Math.round(consistency),
      recommendation: this.getProgressionRecommendation(trend, consistency)
    };
  }

  /**
   * Calculate variance for array of numbers
   * @param {Array} numbers - Array of numbers
   * @returns {number} Variance
   */
  calculateVariance(numbers) {
    if (numbers.length < 2) return 0;
    
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    
    return variance;
  }

  /**
   * Generate personalized next steps
   * @param {Object} result - Evaluation result
   * @param {Object} context - Evaluation context
   * @returns {Array} Personalized next steps
   */
  generatePersonalizedNextSteps(result, context) {
    const { skillCategory, userProfile, careerGoals } = context;
    const { score, adaptiveDifficultyRecommendation } = result;
    
    const steps = [];
    
    // Score-based recommendations
    if (score < 0.6) {
      steps.push('Review fundamental concepts in ' + skillCategory);
      steps.push('Practice with easier exercises to build confidence');
    } else if (score > 0.8) {
      steps.push('Challenge yourself with advanced topics');
      steps.push('Consider teaching others to deepen understanding');
    }
    
    // Career-specific steps
    if (careerGoals.includes('software_engineer') && skillCategory === 'programming') {
      steps.push('Build a portfolio project showcasing this skill');
      steps.push('Contribute to open source projects');
    }
    
    // Adaptive difficulty steps
    if (adaptiveDifficultyRecommendation === 'harder') {
      steps.push('Try advanced challenges in this area');
    } else if (adaptiveDifficultyRecommendation === 'easier') {
      steps.push('Focus on mastering fundamentals first');
    }
    
    return steps;
  }

  /**
   * Generate personalized study plan
   * @param {Object} result - Evaluation result
   * @param {Object} context - Evaluation context
   * @returns {Object} Study plan
   */
  generateStudyPlan(result, context) {
    const { score, estimatedStudyTime } = result;
    const { skillCategory, userProfile } = context;
    
    const intensity = score < 0.5 ? 'intensive' : score > 0.8 ? 'maintenance' : 'regular';
    const duration = estimatedStudyTime || '2-4 hours';
    
    return {
      intensity,
      recommendedDuration: duration,
      frequency: intensity === 'intensive' ? 'daily' : 'weekly',
      focus: score < 0.6 ? 'fundamentals' : 'advanced_topics',
      methods: this.getRecommendedStudyMethods(skillCategory, userProfile.learningStyle)
    };
  }

  /**
   * Helper method to get career applications for a skill
   * @param {string} skillCategory - Skill category
   * @param {Array} careerGoals - User's career goals
   * @returns {Array} Career applications
   */
  getCareerApplications(skillCategory, careerGoals) {
    const applications = {
      programming: [
        'Software development projects',
        'API design and implementation',
        'Code review and optimization',
        'Technical architecture decisions'
      ],
      communication: [
        'Team collaboration and meetings',
        'Client presentations and proposals',
        'Technical documentation',
        'Cross-functional project coordination'
      ],
      leadership: [
        'Team management and mentoring',
        'Strategic planning and execution',
        'Conflict resolution and negotiation',
        'Performance management and feedback'
      ],
      design: [
        'User experience optimization',
        'Brand and visual identity creation',
        'Product design and prototyping',
        'Design system development'
      ],
      analytics: [
        'Data-driven decision making',
        'Performance metrics and KPIs',
        'Market research and insights',
        'A/B testing and experimentation'
      ]
    };

    return applications[skillCategory] || ['General professional development'];
  }

  /**
   * Assess career impact of skill performance
   * @param {number} score - Assessment score
   * @param {string} skillCategory - Skill category
   * @param {Array} careerGoals - Career goals
   * @returns {string} Career impact assessment
   */
  assessCareerImpact(score, skillCategory, careerGoals) {
    if (score >= 0.8) {
      return 'Strong performance demonstrates readiness for senior-level responsibilities';
    } else if (score >= 0.6) {
      return 'Good foundation with room for growth toward leadership roles';
    } else {
      return 'Focus on building core competencies for career advancement';
    }
  }

  /**
   * Get industry demand information for skill
   * @param {string} skillCategory - Skill category
   * @returns {string} Industry demand info
   */
  getIndustryDemand(skillCategory) {
    const demand = {
      programming: 'Very High - Essential for tech industry growth',
      communication: 'High - Critical for leadership and collaboration',
      leadership: 'High - In-demand for management positions',
      design: 'Medium-High - Growing with digital transformation',
      analytics: 'Very High - Essential for data-driven organizations'
    };

    return demand[skillCategory] || 'Medium - Valuable for professional development';
  }

  /**
   * Get progression recommendation based on trend and consistency
   * @param {string} trend - Learning trend
   * @param {number} consistency - Consistency score
   * @returns {string} Progression recommendation
   */
  getProgressionRecommendation(trend, consistency) {
    if (trend === 'improving' && consistency > 70) {
      return 'Excellent progress! Continue current learning approach';
    } else if (trend === 'declining') {
      return 'Consider reviewing fundamentals and adjusting study methods';
    } else if (consistency < 50) {
      return 'Focus on consistent practice to stabilize performance';
    } else {
      return 'Maintain steady practice and gradually increase challenge level';
    }
  }

  /**
   * Get recommended study methods based on skill and learning style
   * @param {string} skillCategory - Skill category
   * @param {string} learningStyle - Learning style preference
   * @returns {Array} Recommended study methods
   */
  getRecommendedStudyMethods(skillCategory, learningStyle) {
    const baseMethods = {
      programming: ['Code practice', 'Project building', 'Code review'],
      communication: ['Presentation practice', 'Writing exercises', 'Peer feedback'],
      leadership: ['Case studies', 'Role playing', 'Mentoring practice'],
      design: ['Portfolio projects', 'Design challenges', 'User testing'],
      analytics: ['Data projects', 'Tool practice', 'Visualization exercises']
    };

    let methods = baseMethods[skillCategory] || ['Practice exercises', 'Study guides', 'Peer learning'];

    // Adapt based on learning style
    if (learningStyle === 'visual') {
      methods.push('Video tutorials', 'Infographics', 'Mind mapping');
    } else if (learningStyle === 'practical') {
      methods.push('Hands-on projects', 'Real-world simulations', 'Lab exercises');
    } else if (learningStyle === 'theoretical') {
      methods.push('Reading materials', 'Research papers', 'Conceptual frameworks');
    }

    return methods;
  }

  /**
   * Create comprehensive fallback evaluation for errors
   * @param {Error} error - The error that occurred
   * @param {Object} question - Question object
   * @param {Object} context - Evaluation context
   * @returns {Object} Fallback evaluation
   */
  createFallbackEvaluation(error, question, context) {
    return {
      score: 0,
      percentage: 0,
      pointsEarned: 0,
      maxPoints: context.maxPoints || question.scoring?.points || 10,
      feedback: `AI evaluation encountered an error: ${error.message}. This response requires manual review by an instructor.`,
      strengths: [],
      improvements: ['Manual evaluation needed due to technical error'],
      keyPointsIdentified: [],
      keyPointsMissed: [],
      skillLevelDemonstrated: 'unknown',
      learningRecommendations: ['Seek instructor feedback for this question'],
      careerRelevance: 'Manual review needed',
      conceptualUnderstanding: 0,
      practicalApplication: 0,
      confidenceIndicators: ['Technical error occurred'],
      confidence: 0,
      requiresHumanReview: true,
      provider: 'openai_fallback',
      model: 'error_fallback',
      evaluatedAt: new Date(),
      error: error.message,
      adaptiveInsights: {
        recommendedDifficulty: 'same',
        skillProgression: {
          trend: 'unknown',
          improvement: 0,
          consistency: 0,
          recommendation: 'Technical error - seek manual evaluation'
        },
        careerAlignment: {
          relevance: 'unknown',
          applications: ['Manual review needed'],
          careerImpact: 'Cannot assess due to technical error'
        },
        nextSteps: ['Contact instructor for manual evaluation'],
        studyPlan: {
          intensity: 'unknown',
          recommendedDuration: 'Unknown',
          frequency: 'unknown',
          focus: 'unknown',
          methods: ['Seek instructor guidance']
        }
      }
    };
  }

  /**
   * Advanced career recommendation generation using OpenAI
   * @param {Object} result - Evaluation result
   * @param {Object} context - User context
   * @returns {Promise<Object>} Career recommendations
   */
  async generateAdvancedCareerRecommendations(result, context) {
    const { skillCategory, careerGoals, userProfile } = context;
    
    try {
      const careerPrompt = `Based on this skill assessment result, provide personalized career guidance:

ASSESSMENT RESULTS:
- Skill: ${skillCategory}
- Score: ${Math.round(result.score * 100)}%
- Demonstrated Level: ${result.skillLevelDemonstrated}
- Career Goals: ${careerGoals.join(', ') || 'Not specified'}
- Experience Level: ${userProfile.experienceLevel || 'Unknown'}

Provide specific, actionable career recommendations in JSON format:
{
  "shortTermGoals": ["<specific 3-6 month goals>"],
  "longTermGoals": ["<specific 1-2 year goals>"],
  "skillGaps": ["<skills to develop for career advancement>"],
  "industryOpportunities": ["<relevant job roles and industries>"],
  "networkingRecommendations": ["<specific networking strategies>"],
  "portfolioSuggestions": ["<projects to showcase this skill>"],
  "certificationRecommendations": ["<relevant certifications to pursue>"],
  "salaryProjections": {
    "currentLevel": "<estimated salary range>",
    "withImprovement": "<potential salary with skill development>"
  }
}`;

      const response = await openAIService.createChatCompletion([
        { 
          role: 'system', 
          content: 'You are an expert career counselor with deep knowledge of industry trends, skill requirements, and career progression paths.' 
        },
        { role: 'user', content: careerPrompt }
      ], {
        model: this.models.recommendations,
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.content);
      
    } catch (error) {
      console.error('Failed to generate career recommendations:', error);
      return {
        shortTermGoals: ['Focus on improving ' + skillCategory + ' skills'],
        longTermGoals: ['Build expertise in chosen career path'],
        skillGaps: ['Technical skills assessment needed'],
        industryOpportunities: ['Various opportunities available'],
        networkingRecommendations: ['Join professional communities'],
        portfolioSuggestions: ['Create projects demonstrating skills'],
        certificationRecommendations: ['Research relevant certifications'],
        salaryProjections: {
          currentLevel: 'Assessment needed',
          withImprovement: 'Potential for growth'
        }
      };
    }
  }

  /**
   * Validate and normalize score value
   * @param {number} score - Raw score value
   * @returns {number} Normalized score (0-1)
   */
  validateScore(score) {
    if (typeof score !== 'number' || isNaN(score)) {
      return 0;
    }
    
    // If score is > 1, assume it's a percentage
    if (score > 1) {
      score = score / 100;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Normalize evaluation result to comprehensive standard format
   * @param {Object} result - Raw evaluation result
   * @param {Object} context - Evaluation context
   * @returns {Object} Comprehensive normalized result
   */
  normalizeEvaluationResult(result, context) {
    const normalizedScore = this.validateScore(result.score);
    const maxPoints = context.maxPoints || 10;

    return {
      // Core scoring
      score: normalizedScore,
      percentage: result.percentage || Math.round(normalizedScore * 100),
      pointsEarned: result.pointsEarned || Math.round(normalizedScore * maxPoints),
      maxPoints: maxPoints,
      
      // Detailed feedback
      feedback: result.feedback || 'Evaluation completed',
      strengths: result.strengths || [],
      improvements: result.improvements || [],
      keyPointsIdentified: result.keyPointsIdentified || [],
      keyPointsMissed: result.keyPointsMissed || [],
      
      // Advanced analysis
      skillLevelDemonstrated: result.skillLevelDemonstrated || 'intermediate',
      learningRecommendations: result.learningRecommendations || [],
      careerRelevance: result.careerRelevance || 'General skill development',
      conceptualUnderstanding: result.conceptualUnderstanding || 70,
      practicalApplication: result.practicalApplication || 70,
      
      // Confidence and review
      confidence: result.confidence || 75,
      logprobsConfidence: result.logprobsConfidence || result.confidence || 75,
      confidenceIndicators: result.confidenceIndicators || [],
      requiresHumanReview: result.requiresHumanReview || normalizedScore < 0.3,
      
      // Adaptive insights
      adaptiveDifficultyRecommendation: result.adaptiveDifficultyRecommendation || 'same',
      estimatedStudyTime: result.estimatedStudyTime || '2-4 hours',
      relatedTopics: result.relatedTopics || [],
      industryApplications: result.industryApplications || [],
      
      // Enhanced insights
      adaptiveInsights: result.adaptiveInsights || {},
      
      // Metadata
      provider: 'openai',
      model: result.model || this.models.evaluation,
      evaluatedAt: result.evaluatedAt || new Date(),
      evaluationVersion: '2.0.0-openai-advanced'
    };
  }

  /**
   * Batch evaluate multiple questions with enhanced processing
   * @param {Array} evaluations - Array of {question, answer, context} objects
   * @param {Object} options - Batch processing options
   * @returns {Promise<Array>} Array of evaluation results with analytics
   */
  async batchEvaluate(evaluations, options = {}) {
    const results = [];
    const startTime = Date.now();
    let successCount = 0;
    let totalConfidence = 0;
    
    console.log(`🔄 Starting batch evaluation of ${evaluations.length} questions`);
    
    for (let i = 0; i < evaluations.length; i++) {
      const evaluation = evaluations[i];
      
      try {
        const result = await this.evaluateAnswer(
          evaluation.question,
          evaluation.answer,
          evaluation.context
        );
        
        results.push({
          questionId: evaluation.question.questionId,
          questionNumber: i + 1,
          success: true,
          result,
          processingTime: Date.now() - startTime
        });
        
        successCount++;
        totalConfidence += result.confidence;
        
        // Progress logging
        if (options.verbose && (i + 1) % 5 === 0) {
          console.log(`📊 Batch progress: ${i + 1}/${evaluations.length} completed`);
        }
        
      } catch (error) {
        console.error(`❌ Batch evaluation failed for question ${evaluation.question.questionId}:`, error);
        
        results.push({
          questionId: evaluation.question.questionId,
          questionNumber: i + 1,
          success: false,
          error: error.message,
          processingTime: Date.now() - startTime
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    const avgConfidence = successCount > 0 ? totalConfidence / successCount : 0;
    
    console.log(`✅ Batch evaluation completed: ${successCount}/${evaluations.length} successful in ${totalTime}ms`);
    
    return {
      results,
      summary: {
        total: evaluations.length,
        successful: successCount,
        failed: evaluations.length - successCount,
        successRate: (successCount / evaluations.length) * 100,
        averageConfidence: Math.round(avgConfidence),
        totalProcessingTime: totalTime,
        averageTimePerQuestion: Math.round(totalTime / evaluations.length)
      }
    };
  }

  /**
   * Get comprehensive service statistics and health metrics
   * @returns {Object} Detailed service statistics
   */
  getStats() {
    return {
      service: 'Advanced OpenAI Evaluation Service',
      version: '2.0.0-openai-advanced',
      provider: this.provider,
      models: this.models,
      status: 'operational',
      features: {
        personalizedPrompts: true,
        confidenceScoring: true,
        adaptiveDifficulty: true,
        careerGuidance: true,
        structuredOutput: true,
        logprobsAnalysis: true,
        batchProcessing: true,
        progressTracking: true
      },
      skillCategories: Object.keys(this.skillCategories),
      settings: {
        temperature: this.settings.temperature,
        maxTokens: this.settings.maxTokens,
        enableLogprobs: this.settings.enableLogprobs,
        topLogprobs: this.settings.topLogprobs
      },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Health check for the AI evaluation service
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      // Test basic OpenAI connectivity
      const testResponse = await openAIService.createChatCompletion([
        { role: 'user', content: 'Health check: respond with "OK"' }
      ], {
        model: this.models.analysis,
        max_tokens: 10,
        temperature: 0
      });

      const isHealthy = testResponse && testResponse.content && testResponse.content.includes('OK');
      
      return {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        provider: this.provider,
        models: this.models,
        connectivity: isHealthy ? 'connected' : 'connection_issues',
        lastCheck: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Health check failed:', error);
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        provider: this.provider,
        error: error.message,
        connectivity: 'failed',
        lastCheck: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
const aiEvaluationService = new AIEvaluationService();

module.exports = {
  aiEvaluationService,
  AIEvaluationService
};