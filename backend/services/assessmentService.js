// services/assessmentService.js
const Assessment = require('../models/Assessment');
const AssessmentSession = require('../models/AssessmentSession');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const { openAIService } = require('./openaiService');
const { AppError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

class AssessmentService {
  /**
   * Create a new assessment session for user
   * @param {string} userId - User ID
   * @param {string} assessmentId - Assessment ID
   * @param {Object} options - Session options
   * @returns {Promise<Object>} Created assessment session
   */
  async createAssessmentSession(userId, assessmentId, options = {}) {
    try {
      console.log(
        `📝 Creating assessment session: User ${userId}, Assessment ${assessmentId}`,
      );

      // Get assessment and user data
      const [assessment, user] = await Promise.all([
        Assessment.findById(assessmentId),
        User.findById(userId),
      ]);

      if (!assessment) {
        throw new AppError('Assessment not found', 404);
      }

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check user eligibility
      const eligibility = await assessment.checkUserEligibility(userId);
      if (!eligibility.eligible) {
        throw new AppError(
          `Not eligible for assessment: ${eligibility.reasons.join(', ')}`,
          403,
        );
      }

      // Check attempt limits
      const existingAttempts = await AssessmentSession.findUserAttempts(
        userId,
        assessmentId,
      );
      const completedAttempts = existingAttempts.filter(
        (a) => a.status === 'completed',
      );

      if (completedAttempts.length >= assessment.attemptSettings.maxAttempts) {
        throw new AppError('Maximum attempts exceeded', 403);
      }

      // Check cooldown period
      if (completedAttempts.length > 0) {
        const lastAttempt = completedAttempts[0];
        const cooldownMs =
          assessment.attemptSettings.cooldownHours * 60 * 60 * 1000;
        const timeSinceLastAttempt =
          Date.now() - new Date(lastAttempt.endTime).getTime();

        if (timeSinceLastAttempt < cooldownMs) {
          const remainingTime = Math.ceil(
            (cooldownMs - timeSinceLastAttempt) / (60 * 60 * 1000),
          );
          throw new AppError(
            `Must wait ${remainingTime} hours before next attempt`,
            429,
          );
        }
      }

      // Get questions - generate if AI assessment without questions
      let questions;
      if (assessment.isAIGenerated && (!assessment.questions || assessment.questions.length === 0)) {
        console.log('🤖 Generating questions for AI assessment...');
        
        // Import AI service manager
        const { aiServiceManager } = require('./aiServiceManager');
        
        // Generate questions using AI
        const generatedQuestions = await aiServiceManager.generateQuestions(
          assessment.title,
          assessment.category,
          assessment.tags[0] || assessment.category, // Use first tag as topic
          assessment.difficulty,
          assessment.totalQuestions || 10,
          ['multiple_choice', 'text', 'essay'],
        );
        
        // Format and save questions to assessment
        assessment.questions = generatedQuestions.map((q, index) => ({
          questionId: `q${index + 1}_${Date.now()}`,
          type: q.type,
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          points: q.points || 10,
          difficulty: q.difficulty || assessment.difficulty,
          timeLimit: q.timeLimit || 300,
          category: assessment.category,
          subcategory: q.category || assessment.tags[0],
          hints: q.hints || [],
          explanation: q.explanation || '',
          order: index + 1,
        }));
        
        // Update scoring based on generated questions
        assessment.scoring.totalPoints = assessment.questions.reduce((sum, q) => sum + q.points, 0);
        
        // Save the questions to the assessment
        await assessment.save();
        console.log(`✅ Generated and saved ${assessment.questions.length} questions`);
        
        questions = assessment.questions;
      } else {
        // Get adaptive questions for existing assessments
        questions = assessment.getAdaptiveQuestions(
          user.learningProfile?.currentLevel || 'intermediate',
          user.learningProfile?.skills || [],
        );
      }

      // Create session with both MongoDB userId and clerkUserId
      const session = new AssessmentSession({
        sessionId: uuidv4(),
        userId,
        clerkUserId: user.clerkUserId, // Add Clerk ID for faster lookups
        assessmentId,
        attemptNumber: existingAttempts.length + 1,
        progress: {
          totalQuestions: questions.length,
        },
        sessionConfig: {
          hasTimeLimit: assessment.timeConstraints.hasTimeLimit,
          totalTimeMinutes: assessment.timeConstraints.totalTimeMinutes,
          questionTimeMinutes: assessment.timeConstraints.questionTimeMinutes,
          allowReview: assessment.attemptSettings.allowReview,
          showResults: assessment.attemptSettings.showResults,
          adaptiveQuestioning: assessment.aiFeatures.adaptiveQuestioning,
        },
        userContext: {
          deviceType: options.deviceType || 'unknown',
          browser: options.browser || 'unknown',
          screenSize: options.screenSize || 'unknown',
          timezone: options.timezone || 'UTC',
          learningStyle: user.learningProfile?.learningStyle || 'visual',
          currentLevel: user.learningProfile?.currentLevel || 'intermediate',
        },
      });

      await session.save();

      console.log(`✅ Assessment session created: ${session.sessionId}`);

      return {
        session: session.getSummary(),
        questions: this.formatQuestionsForUser(questions),
        config: session.sessionConfig,
        timeRemaining: session.sessionConfig.hasTimeLimit
          ? session.sessionConfig.totalTimeMinutes * 60
          : null,
      };
    } catch (error) {
      console.error('❌ Error creating assessment session:', error);
      throw error;
    }
  }

  /**
   * Submit answer for a question in assessment session
   * @param {string} sessionId - Session ID
   * @param {string} questionId - Question ID
   * @param {*} userAnswer - User's answer
   * @param {number} timeSpent - Time spent on question (seconds)
   * @returns {Promise<Object>} Answer submission result
   */
  async submitAnswer(sessionId, questionId, userAnswer, timeSpent = 0) {
    try {
      console.log(
        `📋 Submitting answer: Session ${sessionId}, Question ${questionId}`,
      );

      // Get session and assessment
      const session = await AssessmentSession.findOne({ sessionId });
      if (!session) {
        throw new AppError('Assessment session not found', 404);
      }

      if (session.status !== 'in_progress') {
        throw new AppError('Assessment session is not active', 400);
      }

      // Check for timeout
      if (session.shouldTimeout()) {
        session.status = 'timeout';
        await session.save();
        throw new AppError('Assessment session has timed out', 408);
      }

      // Get assessment and question
      const assessment = await Assessment.findById(session.assessmentId);
      const question = assessment.questions.find(
        (q) => q.questionId === questionId,
      );

      if (!question) {
        throw new AppError('Question not found', 404);
      }

      // Update time tracking
      if (timeSpent > 0) {
        session.updateQuestionTime(questionId, timeSpent);
      }

      // Add answer to session
      await session.addAnswer(questionId, userAnswer, question);

      // Evaluate answer
      const evaluation = await this.evaluateAnswer(
        question,
        userAnswer,
        session,
      );

      // Update answer with evaluation results
      const answerIndex = session.answers.findIndex(
        (a) => a.questionId === questionId,
      );
      if (answerIndex >= 0) {
        session.answers[answerIndex].isCorrect = evaluation.isCorrect;
        session.answers[answerIndex].pointsEarned = evaluation.pointsEarned;
        session.answers[answerIndex].aiEvaluation = evaluation.aiEvaluation;
      }

      await session.save();

      // Update question analytics
      await assessment.updateQuestionAnalytics(
        questionId,
        evaluation.isCorrect,
        timeSpent,
      );

      console.log(
        `✅ Answer submitted and evaluated: ${evaluation.pointsEarned}/${question.points} points`,
      );

      return {
        success: true,
        evaluation: {
          isCorrect: evaluation.isCorrect,
          pointsEarned: evaluation.pointsEarned,
          maxPoints: question.points,
          feedback: evaluation.feedback,
          showCorrectAnswer:
            assessment.attemptSettings.showResults === 'immediately'
              ? evaluation.correctAnswer
              : undefined,
        },
        progress: session.progress,
        nextQuestionId: this.getNextQuestionId(session, assessment),
      };
    } catch (error) {
      console.error('❌ Error submitting answer:', error);
      throw error;
    }
  }

  /**
   * Submit full assessment with all answers at once
   * @param {string} sessionId - Session ID
   * @param {Object} answers - All question answers
   * @returns {Promise<Object>} Assessment submission results
   */
  async submitFullAssessment(sessionId, answers) {
    try {
      console.log(`📝 Submitting full assessment: ${sessionId}`);

      // Get session and assessment
      const session = await AssessmentSession.findOne({ sessionId });
      if (!session) {
        throw new AppError('Assessment session not found', 404);
      }

      if (session.status !== 'in_progress') {
        throw new AppError('Assessment session is not active', 400);
      }

      const assessment = await Assessment.findById(session.assessmentId);
      if (!assessment) {
        throw new AppError('Assessment not found', 404);
      }

      // Submit each answer
      const submissionResults = [];
      for (const [questionId, answer] of Object.entries(answers)) {
        try {
          const result = await this.submitAnswer(sessionId, questionId, answer, 0);
          submissionResults.push({
            questionId,
            success: true,
            result: result.evaluation,
          });
        } catch (error) {
          submissionResults.push({
            questionId,
            success: false,
            error: error.message,
          });
        }
      }

      // Complete the assessment
      const finalResults = await this.completeAssessment(sessionId, {});

      return {
        sessionId,
        submissionResults,
        finalResults,
        summary: {
          totalQuestions: Object.keys(answers).length,
          successfulSubmissions: submissionResults.filter(r => r.success).length,
          failedSubmissions: submissionResults.filter(r => !r.success).length,
          finalScore: finalResults.results.finalScore,
          passed: finalResults.results.passed,
        },
      };
    } catch (error) {
      console.error('❌ Error submitting full assessment:', error);
      throw error;
    }
  }

  /**
   * Complete assessment session and calculate final results
   * @param {string} sessionId - Session ID
   * @param {Object} finalAnswers - Any remaining answers
   * @returns {Promise<Object>} Final assessment results
   */
  async completeAssessment(sessionId, finalAnswers = {}) {
    try {
      console.log(`🎯 Completing assessment session: ${sessionId}`);

      // Get session and assessment
      const session = await AssessmentSession.findOne({ sessionId });
      if (!session) {
        throw new AppError('Assessment session not found', 404);
      }

      const assessment = await Assessment.findById(
        session.assessmentId,
      ).populate('relatedPaths relatedModules');

      // Submit any final answers
      for (const [questionId, answer] of Object.entries(finalAnswers)) {
        await this.submitAnswer(sessionId, questionId, answer, 0);
      }

      // Complete the session
      await session.complete();

      // Calculate comprehensive results
      const results = await this.calculateComprehensiveResults(
        session,
        assessment,
      );

      // Update session with results
      session.results = results;
      await session.save();

      // Update assessment analytics
      await this.updateAssessmentAnalytics(assessment, session);

      // Update user progress
      await this.updateUserProgress(session, results, assessment);

      // Generate AI-powered insights and recommendations
      const aiInsights = await this.generateAIInsights(
        session,
        results,
        assessment,
      );
      session.results.aiInsights = aiInsights;
      await session.save();

      console.log(
        `✅ Assessment completed: ${results.finalScore}% (${
          results.passed ? 'PASSED' : 'FAILED'
        })`,
      );

      return {
        sessionId: session.sessionId,
        results: session.results,
        assessment: {
          id: assessment._id,
          title: assessment.title,
          type: assessment.type,
          category: assessment.category,
        },
        recommendations: aiInsights.nextSteps,
        certificateEligible:
          results.passed && assessment.certification.issuesCertificate,
      };
    } catch (error) {
      console.error('❌ Error completing assessment:', error);
      throw error;
    }
  }

  /**
   * Evaluate a single answer (supports AI-enhanced evaluation)
   * @param {Object} question - Question object
   * @param {*} userAnswer - User's answer
   * @param {Object} session - Assessment session
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluateAnswer(question, userAnswer, session) {
    console.log(
      `🔍 Evaluating ${question.type} question: ${question.questionId}`,
    );

    let evaluation = {
      isCorrect: false,
      pointsEarned: 0,
      feedback: '',
      correctAnswer: question.correctAnswer,
      aiEvaluation: null,
    };

    try {
      switch (question.type) {
      case 'multiple_choice':
      case 'true_false':
        evaluation = this.evaluateMultipleChoice(question, userAnswer);
        break;

      case 'multiple_select':
        evaluation = this.evaluateMultipleSelect(question, userAnswer);
        break;

      case 'short_answer':
        evaluation = await this.evaluateShortAnswer(
          question,
          userAnswer,
          session,
        );
        break;

      case 'essay':
      case 'scenario_analysis':
        evaluation = await this.evaluateEssayWithAI(
          question,
          userAnswer,
          session,
        );
        break;

      case 'code_review':
        evaluation = await this.evaluateCodeWithAI(
          question,
          userAnswer,
          session,
        );
        break;

      case 'practical_task':
        evaluation = await this.evaluatePracticalTask(
          question,
          userAnswer,
          session,
        );
        break;

      default:
        evaluation.feedback =
            'Question type not supported for automatic evaluation';
      }

      return evaluation;
    } catch (error) {
      console.error('Error evaluating answer:', error);
      evaluation.feedback = 'Error occurred during evaluation';
      return evaluation;
    }
  }

  /**
   * Evaluate multiple choice questions
   * @param {Object} question - Question object
   * @param {string} userAnswer - User's answer
   * @returns {Object} Evaluation result
   */
  evaluateMultipleChoice(question, userAnswer) {
    const correctOption = question.options.find((opt) => opt.isCorrect);
    const selectedOption = question.options.find(
      (opt) => opt.id === userAnswer,
    );

    const isCorrect =
      correctOption && selectedOption && correctOption.id === selectedOption.id;

    return {
      isCorrect,
      pointsEarned: isCorrect ? question.points : 0,
      feedback: selectedOption?.explanation || correctOption?.explanation || '',
      correctAnswer: correctOption?.id || null,
    };
  }

  /**
   * Evaluate multiple select questions
   * @param {Object} question - Question object
   * @param {Array} userAnswer - User's selected answers
   * @returns {Object} Evaluation result
   */
  evaluateMultipleSelect(question, userAnswer) {
    if (!Array.isArray(userAnswer)) userAnswer = [userAnswer];

    const correctOptions = question.options
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.id);
    const selectedOptions = userAnswer;

    // Calculate partial credit
    const correctSelections = selectedOptions.filter((sel) =>
      correctOptions.includes(sel),
    ).length;
    const incorrectSelections = selectedOptions.filter(
      (sel) => !correctOptions.includes(sel),
    ).length;
    const missedCorrect = correctOptions.length - correctSelections;

    // Scoring: +1 for correct, -0.5 for incorrect, -0.25 for missed
    const score = Math.max(
      0,
      correctSelections - incorrectSelections * 0.5 - missedCorrect * 0.25,
    );
    const maxScore = correctOptions.length;
    const percentage = score / maxScore;

    const isCorrect = percentage >= 0.7; // 70% threshold for correctness
    const pointsEarned = Math.round(question.points * percentage);

    return {
      isCorrect,
      pointsEarned,
      feedback: `Selected ${correctSelections} of ${correctOptions.length} correct options`,
      correctAnswer: correctOptions,
    };
  }

  /**
   * Evaluate short answer with AI assistance
   * @param {Object} question - Question object
   * @param {string} userAnswer - User's answer
   * @param {Object} session - Assessment session
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluateShortAnswer(question, userAnswer, session) {
    if (!question.evaluationCriteria?.aiPrompt) {
      // Simple keyword matching if no AI evaluation
      return this.evaluateWithKeywords(question, userAnswer);
    }

    try {
      const prompt = this.buildEvaluationPrompt(
        question,
        userAnswer,
        'short_answer',
      );
      const aiResponse = await openAIService.createChatCompletion(
        [
          { role: 'system', content: prompt },
          {
            role: 'user',
            content: `Question: "${question.question}"\nUser Answer: "${userAnswer}"`,
          },
        ],
        {
          temperature: 0.1, // Low temperature for consistent evaluation
          maxTokens: 300,
        },
      );

      const evaluation = this.parseAIEvaluation(
        aiResponse.content,
        question.points,
      );

      return {
        isCorrect: evaluation.score >= 0.7,
        pointsEarned: Math.round(question.points * evaluation.score),
        feedback: evaluation.feedback,
        aiEvaluation: {
          score: evaluation.score * 100,
          feedback: evaluation.feedback,
          keyPointsIdentified: evaluation.keyPoints || [],
          confidence: 85,
          requiresHumanReview:
            evaluation.score < 0.3 || evaluation.score > 0.95,
        },
      };
    } catch (error) {
      console.error('AI evaluation failed, using keyword fallback:', error);
      return this.evaluateWithKeywords(question, userAnswer);
    }
  }

  /**
   * Evaluate essay questions with comprehensive AI analysis
   * @param {Object} question - Question object
   * @param {string} userAnswer - User's essay
   * @param {Object} session - Assessment session
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluateEssayWithAI(question, userAnswer, session) {
    try {
      console.log('🤖 Using AI for comprehensive essay evaluation');

      const prompt = this.buildEvaluationPrompt(question, userAnswer, 'essay');
      const aiResponse = await openAIService.createChatCompletion(
        [
          { role: 'system', content: prompt },
          {
            role: 'user',
            content: `Question: "${question.question}"\n\nStudent Essay:\n"${userAnswer}"`,
          },
        ],
        {
          temperature: 0.2,
          maxTokens: 800,
        },
      );

      const evaluation = this.parseAdvancedAIEvaluation(
        aiResponse.content,
        question.points,
      );

      return {
        isCorrect: evaluation.score >= 0.6, // Lower threshold for essays
        pointsEarned: Math.round(question.points * evaluation.score),
        feedback: evaluation.feedback,
        aiEvaluation: {
          score: evaluation.score * 100,
          feedback: evaluation.feedback,
          keyPointsIdentified: evaluation.keyPoints || [],
          improvementSuggestions: evaluation.improvements || [],
          confidence: evaluation.confidence || 80,
          requiresHumanReview: evaluation.score < 0.4 || evaluation.needsReview,
        },
      };
    } catch (error) {
      console.error('AI essay evaluation failed:', error);
      return {
        isCorrect: false,
        pointsEarned: 0,
        feedback: 'Essay submitted for manual review',
        aiEvaluation: {
          score: 0,
          feedback: 'Automatic evaluation failed - requires human review',
          requiresHumanReview: true,
          confidence: 0,
        },
      };
    }
  }

  /**
   * Build AI evaluation prompt based on question type
   * @param {Object} question - Question object
   * @param {string} userAnswer - User's answer
   * @param {string} questionType - Type of question
   * @returns {string} AI prompt
   */
  buildEvaluationPrompt(question, userAnswer, questionType) {
    const basePrompt = 'You are an expert educational assessor. Evaluate the student\'s answer objectively and provide constructive feedback.';

    const typeSpecificPrompts = {
      short_answer: `
        Evaluation Criteria:
        - Accuracy of content (40%)
        - Completeness of answer (30%) 
        - Clarity and understanding (20%)
        - Proper terminology usage (10%)
        
        Key Points to Look For: ${
  question.evaluationCriteria?.keyPoints?.join(', ') || 'N/A'
}
        
        Respond with a JSON object:
        {
          "score": 0.0-1.0,
          "feedback": "detailed feedback",
          "keyPoints": ["identified key points"],
          "missing": ["missing elements"]
        }
      `,

      essay: `
        Evaluation Criteria:
        - Content knowledge and accuracy (30%)
        - Critical thinking and analysis (25%)
        - Organization and structure (20%)
        - Writing quality and clarity (15%)
        - Use of examples/evidence (10%)
        
        Scoring Rubric: ${JSON.stringify(
    question.evaluationCriteria?.scoringRubric || [],
  )}
        
        Respond with a JSON object:
        {
          "score": 0.0-1.0,
          "feedback": "comprehensive feedback",
          "keyPoints": ["strengths identified"],
          "improvements": ["areas for improvement"],
          "needsReview": false,
          "confidence": 0-100
        }
      `,

      code_review: `
        Evaluation Criteria:
        - Code correctness and functionality (40%)
        - Code quality and best practices (25%)
        - Problem-solving approach (20%)
        - Code efficiency and optimization (15%)
        
        Respond with a JSON object including code quality analysis.
      `,
    };

    return (
      basePrompt +
      '\n\n' +
      (typeSpecificPrompts[questionType] || typeSpecificPrompts.short_answer)
    );
  }

  /**
   * Parse AI evaluation response
   * @param {string} aiResponse - AI response content
   * @param {number} maxPoints - Maximum points for question
   * @returns {Object} Parsed evaluation
   */
  parseAIEvaluation(aiResponse, maxPoints) {
    try {
      // Try to parse JSON response
      const cleaned = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      const evaluation = JSON.parse(cleaned);

      return {
        score: Math.max(0, Math.min(1, evaluation.score || 0)),
        feedback: evaluation.feedback || 'No feedback provided',
        keyPoints: evaluation.keyPoints || [],
        improvements: evaluation.improvements || evaluation.missing || [],
      };
    } catch (error) {
      console.error('Failed to parse AI evaluation:', error);

      // Fallback: try to extract score from text
      const scoreMatch = aiResponse.match(
        /(\d+(?:\.\d+)?)\s*(?:\/|out\s+of|points?|%)/i,
      );
      const score = scoreMatch ? parseFloat(scoreMatch[1]) / maxPoints : 0;

      return {
        score: Math.max(0, Math.min(1, score)),
        feedback: aiResponse.slice(0, 200) + '...',
        keyPoints: [],
        improvements: [],
      };
    }
  }

  /**
   * Parse advanced AI evaluation for essays
   * @param {string} aiResponse - AI response content
   * @param {number} maxPoints - Maximum points for question
   * @returns {Object} Parsed evaluation
   */
  parseAdvancedAIEvaluation(aiResponse, maxPoints) {
    try {
      const cleaned = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      const evaluation = JSON.parse(cleaned);

      return {
        score: Math.max(0, Math.min(1, evaluation.score || 0)),
        feedback: evaluation.feedback || 'No feedback provided',
        keyPoints: evaluation.keyPoints || [],
        improvements: evaluation.improvements || [],
        confidence: evaluation.confidence || 75,
        needsReview: evaluation.needsReview || false,
      };
    } catch (error) {
      console.error('Failed to parse advanced AI evaluation:', error);
      return this.parseAIEvaluation(aiResponse, maxPoints);
    }
  }

  // Helper methods continue...

  /**
   * Format questions for user display (hide correct answers, etc.)
   * @param {Array} questions - Assessment questions
   * @returns {Array} Formatted questions
   */
  formatQuestionsForUser(questions) {
    return questions.map((q) => ({
      questionId: q.questionId,
      type: q.type,
      question: q.question,
      description: q.description,
      options: q.options
        ? q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
        }))
        : undefined,
      points: q.points,
      estimatedTimeMinutes: q.estimatedTimeMinutes,
      tags: q.tags,
      difficulty: q.difficulty,
    }));
  }

  /**
   * Get next question ID for adaptive questioning
   * @param {Object} session - Assessment session
   * @param {Object} assessment - Assessment object
   * @returns {string|null} Next question ID or null if complete
   */
  getNextQuestionId(session, assessment) {
    const answeredQuestionIds = session.answers.map((a) => a.questionId);
    const availableQuestions = assessment.questions.filter(
      (q) => q.isActive && !answeredQuestionIds.includes(q.questionId),
    );

    if (availableQuestions.length === 0) return null;

    // For adaptive questioning, implement more sophisticated logic here
    return availableQuestions[0].questionId;
  }

  /**
   * Calculate comprehensive assessment results
   * @param {Object} session - Assessment session
   * @param {Object} assessment - Assessment object
   * @returns {Promise<Object>} Comprehensive results
   */
  async calculateComprehensiveResults(session, assessment) {
    const answers = session.answers;
    const totalPointsEarned = answers.reduce(
      (sum, a) => sum + (a.pointsEarned || 0),
      0,
    );
    const totalPointsPossible = answers.reduce(
      (sum, a) => sum + a.maxPoints,
      0,
    );

    const finalScore =
      totalPointsPossible > 0
        ? (totalPointsEarned / totalPointsPossible) * 100
        : 0;
    const passed = finalScore >= assessment.scoring.passingScore;

    // Calculate detailed breakdowns
    const scoreByDifficulty = this.calculateScoreByDifficulty(
      answers,
      assessment,
    );
    const scoreBySkill = this.calculateScoreBySkill(answers, assessment);
    const scoreByQuestionType = this.calculateScoreByType(answers, assessment);

    // Generate strengths and weaknesses
    const { strengths, weaknesses } = this.analyzePerformance(
      answers,
      assessment,
    );

    // Calculate grade
    const grade = this.calculateGrade(finalScore);

    return {
      finalScore: Math.round(finalScore * 100) / 100,
      totalPointsEarned,
      totalPointsPossible,
      passingScore: assessment.scoring.passingScore,
      passed,
      grade,
      totalTimeSpent: session.timeTracking.totalTimeSpent,
      averageTimePerQuestion: Math.round(
        session.timeTracking.totalTimeSpent / answers.length,
      ),
      scoreByDifficulty,
      scoreBySkill,
      scoreByQuestionType,
      strengths,
      weaknesses,
      recommendations: [], // Will be filled by AI insights
    };
  }

  // Additional helper methods...
  calculateScoreByDifficulty(answers, assessment) {
    const difficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    const result = {};

    difficulties.forEach((diff) => {
      const questionsAtLevel = assessment.questions.filter(
        (q) => q.difficulty === diff,
      );
      const answersAtLevel = answers.filter((a) =>
        questionsAtLevel.some((q) => q.questionId === a.questionId),
      );

      if (answersAtLevel.length > 0) {
        const earned = answersAtLevel.reduce(
          (sum, a) => sum + (a.pointsEarned || 0),
          0,
        );
        const possible = answersAtLevel.reduce(
          (sum, a) => sum + a.maxPoints,
          0,
        );
        result[diff] = possible > 0 ? Math.round((earned / possible) * 100) : 0;
      } else {
        result[diff] = 0;
      }
    });

    return result;
  }

  calculateScoreBySkill(answers, assessment) {
    const skillScores = {};

    assessment.questions.forEach((question) => {
      if (question.skills && question.skills.length > 0) {
        question.skills.forEach((skill) => {
          if (!skillScores[skill.name]) {
            skillScores[skill.name] = { earned: 0, possible: 0 };
          }

          const answer = answers.find(
            (a) => a.questionId === question.questionId,
          );
          if (answer) {
            skillScores[skill.name].earned +=
              (answer.pointsEarned || 0) * (skill.weight || 1);
            skillScores[skill.name].possible +=
              answer.maxPoints * (skill.weight || 1);
          }
        });
      }
    });

    return Object.entries(skillScores).map(([skill, scores]) => ({
      skill,
      score: scores.earned,
      maxScore: scores.possible,
      percentage:
        scores.possible > 0
          ? Math.round((scores.earned / scores.possible) * 100)
          : 0,
    }));
  }

  calculateScoreByType(answers, assessment) {
    const typeScores = {};

    assessment.questions.forEach((question) => {
      if (!typeScores[question.type]) {
        typeScores[question.type] = { earned: 0, possible: 0 };
      }

      const answer = answers.find((a) => a.questionId === question.questionId);
      if (answer) {
        typeScores[question.type].earned += answer.pointsEarned || 0;
        typeScores[question.type].possible += answer.maxPoints;
      }
    });

    return Object.entries(typeScores).map(([type, scores]) => ({
      type,
      score: scores.earned,
      maxScore: scores.possible,
      percentage:
        scores.possible > 0
          ? Math.round((scores.earned / scores.possible) * 100)
          : 0,
    }));
  }

  analyzePerformance(answers, assessment) {
    const strengths = [];
    const weaknesses = [];

    // Analyze by difficulty
    const difficultyScores = this.calculateScoreByDifficulty(
      answers,
      assessment,
    );
    Object.entries(difficultyScores).forEach(([diff, score]) => {
      if (score >= 80) {
        strengths.push(`Strong performance in ${diff} level questions`);
      } else if (score < 50) {
        weaknesses.push(`Needs improvement in ${diff} level questions`);
      }
    });

    // Analyze by question type
    const typeScores = this.calculateScoreByType(answers, assessment);
    typeScores.forEach(({ type, percentage }) => {
      if (percentage >= 80) {
        strengths.push(`Excellent ${type.replace('_', ' ')} skills`);
      } else if (percentage < 50) {
        weaknesses.push(`Difficulty with ${type.replace('_', ' ')} questions`);
      }
    });

    return { strengths, weaknesses };
  }

  calculateGrade(finalScore) {
    if (finalScore >= 97) return 'A+';
    if (finalScore >= 93) return 'A';
    if (finalScore >= 90) return 'A-';
    if (finalScore >= 87) return 'B+';
    if (finalScore >= 83) return 'B';
    if (finalScore >= 80) return 'B-';
    if (finalScore >= 77) return 'C+';
    if (finalScore >= 73) return 'C';
    if (finalScore >= 70) return 'C-';
    if (finalScore >= 67) return 'D+';
    if (finalScore >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate AI-powered insights and recommendations
   * @param {Object} session - Assessment session
   * @param {Object} results - Assessment results
   * @param {Object} assessment - Assessment object
   * @returns {Promise<Object>} AI insights
   */
  async generateAIInsights(session, results, assessment) {
    try {
      const prompt = `You are an educational AI assistant analyzing assessment results. Provide personalized learning insights and recommendations.

Assessment Details:
- Title: ${assessment.title}
- Category: ${assessment.category}
- Type: ${assessment.type}
- Final Score: ${results.finalScore}%
- Passed: ${results.passed}
- Time Spent: ${Math.round(results.totalTimeSpent / 60)} minutes

Performance Breakdown:
- Strengths: ${results.strengths.join(', ') || 'None identified'}
- Weaknesses: ${results.weaknesses.join(', ') || 'None identified'}
- Score by Difficulty: ${JSON.stringify(results.scoreByDifficulty)}

Provide a JSON response with:
{
  "overallAssessment": "concise overall assessment",
  "learningGaps": ["specific learning gaps"],
  "nextSteps": ["actionable next steps"],
  "studyRecommendations": ["study recommendations"],
  "estimatedImprovementTime": hours_as_number
}`;

      const aiResponse = await openAIService.createChatCompletion(
        [{ role: 'system', content: prompt }],
        {
          temperature: 0.3,
          maxTokens: 500,
        },
      );

      const insights = JSON.parse(
        aiResponse.content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim(),
      );

      return {
        overallAssessment: insights.overallAssessment || 'Assessment completed',
        learningGaps: insights.learningGaps || [],
        nextSteps: insights.nextSteps || [],
        studyRecommendations: insights.studyRecommendations || [],
        estimatedImprovementTime: insights.estimatedImprovementTime || 10,
        confidenceLevel: 85,
      };
    } catch (error) {
      console.error('Failed to generate AI insights:', error);

      // Fallback insights
      return {
        overallAssessment: `Completed ${assessment.title} with ${results.finalScore}% score`,
        learningGaps: results.weaknesses,
        nextSteps: results.passed
          ? ['Continue to advanced topics', 'Consider related assessments']
          : [
            'Review weak areas',
            'Practice more questions',
            'Retake assessment',
          ],
        studyRecommendations: [
          'Focus on identified weak areas',
          'Review related learning materials',
        ],
        estimatedImprovementTime: results.passed ? 5 : 15,
        confidenceLevel: 60,
      };
    }
  }

  // Additional methods for updating analytics, user progress, etc.
  async updateAssessmentAnalytics(assessment, session) {
    assessment.analytics.totalAttempts += 1;

    if (session.results.passed) {
      const currentPassCount =
        (assessment.analytics.passRate *
          (assessment.analytics.totalAttempts - 1)) /
        100;
      assessment.analytics.passRate =
        ((currentPassCount + 1) / assessment.analytics.totalAttempts) * 100;
    }

    // Update average score
    const currentTotal =
      assessment.analytics.averageScore *
      (assessment.analytics.totalAttempts - 1);
    assessment.analytics.averageScore =
      (currentTotal + session.results.finalScore) /
      assessment.analytics.totalAttempts;

    // Update average time
    const currentTimeTotal =
      assessment.analytics.averageTimeSpent *
      (assessment.analytics.totalAttempts - 1);
    assessment.analytics.averageTimeSpent =
      (currentTimeTotal + session.results.totalTimeSpent) /
      assessment.analytics.totalAttempts;

    await assessment.save();
  }

  async updateUserProgress(session, results, assessment) {
    // Update user statistics and create progress records for related paths/modules
    const user = await User.findById(session.userId);
    if (user) {
      user.statistics.totalAssessments += 1;
      user.statistics.lastAssessmentDate = new Date();
      user.statistics.lastAssessmentScore = results.finalScore;

      if (results.passed) {
        user.statistics.assessmentsPassed += 1;
      }

      await user.save();
    }

    // Update related learning path progress
    for (const relatedPath of assessment.relatedPaths || []) {
      let progress = await UserProgress.findOne({
        userId: session.userId,
        pathId: relatedPath._id,
      });

      if (progress) {
        progress.performance.assessmentResults.push({
          assessmentId: assessment._id,
          score: results.finalScore,
          passed: results.passed,
          completedAt: new Date(),
        });

        // Update average score
        const scores = progress.performance.assessmentResults.map(
          (r) => r.score,
        );
        progress.performance.averageScore =
          scores.reduce((a, b) => a + b, 0) / scores.length;

        await progress.save();
      }
    }
  }

  // Fallback evaluation methods
  evaluateWithKeywords(question, userAnswer) {
    if (!question.correctAnswer || typeof question.correctAnswer !== 'string') {
      return {
        isCorrect: false,
        pointsEarned: 0,
        feedback: 'Unable to evaluate - requires manual review',
      };
    }

    const userLower = userAnswer.toLowerCase();
    const correctLower = question.correctAnswer.toLowerCase();

    // Simple keyword matching
    const keywordMatch = correctLower
      .split(' ')
      .some((word) => word.length > 2 && userLower.includes(word));

    // Exact match
    const exactMatch = userLower === correctLower;

    // Partial match
    const partialMatch =
      userLower.includes(correctLower) || correctLower.includes(userLower);

    let score = 0;
    let feedback = '';

    if (exactMatch) {
      score = 1;
      feedback = 'Correct answer';
    } else if (partialMatch) {
      score = 0.7;
      feedback = 'Partially correct - contains key elements';
    } else if (keywordMatch) {
      score = 0.5;
      feedback = 'Partially correct - contains some key terms';
    } else {
      score = 0;
      feedback = 'Incorrect answer';
    }

    return {
      isCorrect: score >= 0.7,
      pointsEarned: Math.round(question.points * score),
      feedback,
    };
  }

  async evaluateCodeWithAI(question, userAnswer, session) {
    // Simplified code evaluation - would need more sophisticated logic
    return this.evaluateShortAnswer(question, userAnswer, session);
  }

  async evaluatePracticalTask(question, userAnswer, session) {
    // Mark for manual review by default
    return {
      isCorrect: false,
      pointsEarned: 0,
      feedback: 'Practical task submitted for instructor review',
      aiEvaluation: {
        requiresHumanReview: true,
        confidence: 0,
      },
    };
  }
}

// Export singleton instance
const assessmentService = new AssessmentService();

module.exports = {
  assessmentService,
  AssessmentService,
};
