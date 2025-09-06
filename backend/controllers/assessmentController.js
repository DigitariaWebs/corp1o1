// controllers/assessmentController.js
const Assessment = require('../models/Assessment');
const AssessmentSession = require('../models/AssessmentSession');
const User = require('../models/User');
const { assessmentService } = require('../services/assessmentService');
const { certificateService } = require('../services/certificateService');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { aiServiceManager } = require('../services/aiServiceManager');

/**
 * Get available assessments for user
 * GET /api/assessments/available
 */
const getAvailableAssessments = catchAsync(async (req, res) => {
  // Handle different user ID sources
  let userId = req.user?._id || req.userId || req.headers['user-id'];
  
  // If no valid userId, use or create test user
  const mongoose = require('mongoose');
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    const User = require('../models/User');
    let defaultUser = await User.findOne({ email: 'test@sokol.dev' });
    if (defaultUser) {
      userId = defaultUser._id;
    } else {
      // Return empty if no user
      return res.status(200).json({
        success: true,
        data: {
          assessments: [],
          totalCount: 0,
          hasMore: false,
        },
      });
    }
  }
  
  const { category, difficulty, type, limit = 20, offset = 0 } = req.query;

  console.log(`📝 Getting available assessments for user: ${userId}`);

  // Build query filters
  const filters = {
    isActive: true,
    isPublished: true,
  };

  if (category) filters.category = category;
  if (difficulty && difficulty !== 'all') filters.difficulty = difficulty;
  if (type) filters.type = type;

  // For now, simplify to get all matching assessments (including AI-generated)
  // This bypasses complex eligibility checks that might filter out new assessments
  const eligibleAssessments = await Assessment.find(filters)
    .sort({ createdAt: -1 })
    .skip(parseInt(offset))
    .limit(parseInt(limit))
    .lean();

  // Get user's attempt history for these assessments
  const assessmentIds = eligibleAssessments.map((a) => a._id);
  const userAttempts = await AssessmentSession.aggregate([
    {
      $match: {
        userId: userId,
        assessmentId: { $in: assessmentIds },
      },
    },
    {
      $group: {
        _id: '$assessmentId',
        totalAttempts: { $sum: 1 },
        completedAttempts: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        bestScore: { $max: '$results.finalScore' },
        lastAttempt: { $max: '$startTime' },
        hasPassed: {
          $max: { $cond: ['$results.passed', 1, 0] },
        },
      },
    },
  ]);

  // Create attempts lookup
  const attemptsLookup = {};
  userAttempts.forEach((attempt) => {
    attemptsLookup[attempt._id.toString()] = attempt;
  });

  // Format response data
  const assessments = eligibleAssessments.map((assessment) => {
    const attemptData = attemptsLookup[assessment._id.toString()] || {
      totalAttempts: 0,
      completedAttempts: 0,
      bestScore: null,
      lastAttempt: null,
      hasPassed: false,
    };

    return {
      id: assessment._id,
      title: assessment.title,
      description: assessment.description,
      type: assessment.type,
      category: assessment.category,
      difficulty: assessment.difficulty,
      questionCount: assessment.questionCount,
      estimatedDuration: assessment.estimatedDuration,
      passingScore: assessment.scoring.passingScore,
      maxAttempts: assessment.attemptSettings.maxAttempts,
      timeConstraints: assessment.timeConstraints,
      aiFeatures: assessment.aiFeatures,
      certification: assessment.certification,
      tags: assessment.tags,
      userProgress: {
        attempts: attemptData.totalAttempts,
        completedAttempts: attemptData.completedAttempts,
        bestScore: attemptData.bestScore,
        lastAttempt: attemptData.lastAttempt,
        hasPassed: attemptData.hasPassed > 0,
        canRetake:
            attemptData.completedAttempts <
            assessment.attemptSettings.maxAttempts,
      },
      analytics: {
        averageScore: assessment.analytics.averageScore,
        passRate: assessment.analytics.passRate,
        totalAttempts: assessment.analytics.totalAttempts,
      },
    };
  });

  res.status(200).json({
    success: true,
    data: {
      assessments,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: eligibleAssessments.length,
      },
      filters: { category, difficulty, type },
    },
  });
});

/**
 * Get specific assessment details
 * GET /api/assessments/:assessmentId
 */
const getAssessmentDetails = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { assessmentId } = req.params;

  console.log(
    `🔍 Getting assessment details: ${assessmentId} for user: ${userId}`,
  );

  const assessment = await Assessment.findById(assessmentId)
    .populate('relatedPaths', 'title category difficulty')
    .populate('relatedModules', 'title difficulty');

  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  if (!assessment.isActive || !assessment.isPublished) {
    throw new AppError('Assessment not available', 403);
  }

  // Check eligibility
  const eligibility = await assessment.checkUserEligibility(userId);

  // Get user's attempt history
  const userAttempts = await AssessmentSession.findUserAttempts(
    userId,
    assessmentId,
  );
  const bestAttempt = await AssessmentSession.findBestAttempt(
    userId,
    assessmentId,
  );

  // Check certificate eligibility if assessment issues certificates
  let certificateInfo = null;
  if (assessment.certification.issuesCertificate) {
    const certEligibility =
      await certificateService.checkCertificateEligibility(
        userId,
        assessmentId,
      );
    certificateInfo = {
      eligible: certEligibility.eligible,
      reason: certEligibility.reason,
      requiredScore: assessment.certification.requiredScore,
    };
  }

  res.status(200).json({
    success: true,
    data: {
      assessment: {
        id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        type: assessment.type,
        category: assessment.category,
        difficulty: assessment.difficulty,
        questionCount: assessment.questionCount,
        estimatedDuration: assessment.estimatedDuration,
        scoring: assessment.scoring,
        timeConstraints: assessment.timeConstraints,
        attemptSettings: assessment.attemptSettings,
        aiFeatures: assessment.aiFeatures,
        certification: assessment.certification,
        relatedPaths: assessment.relatedPaths,
        relatedModules: assessment.relatedModules,
        tags: assessment.tags,
        prerequisites: assessment.prerequisites,
      },
      eligibility,
      userProgress: {
        totalAttempts: userAttempts.length,
        completedAttempts: userAttempts.filter((a) => a.status === 'completed')
          .length,
        bestScore: bestAttempt?.results?.finalScore || null,
        lastAttempt: userAttempts[0] || null,
        hasPassed: bestAttempt?.results?.passed || false,
      },
      certificateInfo,
      analytics: {
        averageScore: assessment.analytics.averageScore,
        passRate: assessment.analytics.passRate,
        totalAttempts: assessment.analytics.totalAttempts,
        averageTime: assessment.analytics.averageTimeSpent,
      },
    },
  });
});

/**
 * Start new assessment session
 * POST /api/assessments/:assessmentId/start
 */
const startAssessment = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { assessmentId } = req.params;
  const sessionOptions = req.body;

  console.log(
    `▶️ Starting assessment session: ${assessmentId} for user: ${userId}`,
  );

  const sessionData = await assessmentService.createAssessmentSession(
    userId,
    assessmentId,
    sessionOptions,
  );

  res.status(201).json({
    success: true,
    data: sessionData,
  });
});

/**
 * Get current session status
 * GET /api/assessments/sessions/:sessionId
 */
const getSessionStatus = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { sessionId } = req.params;

  console.log(`📊 Getting session status: ${sessionId}`);

  const session = await AssessmentSession.findOne({
    sessionId,
    userId,
  }).populate('assessmentId', 'title type category timeConstraints');

  if (!session) {
    throw new AppError('Session not found', 404);
  }

  // Check if session should timeout
  if (session.status === 'in_progress' && session.shouldTimeout()) {
    session.status = 'timeout';
    await session.save();
  }

  res.status(200).json({
    success: true,
    data: {
      session: session.getSummary(),
      assessment: {
        id: session.assessmentId._id,
        title: session.assessmentId.title,
        type: session.assessmentId.type,
        category: session.assessmentId.category,
      },
      timeRemaining: session.sessionConfig.hasTimeLimit
        ? Math.max(
          0,
          session.sessionConfig.totalTimeMinutes * 60 -
              session.timeTracking.totalTimeSpent,
        )
        : null,
      canContinue: ['in_progress', 'paused'].includes(session.status),
    },
  });
});

/**
 * Submit answer for question
 * POST /api/assessments/sessions/:sessionId/answer
 */
const submitAnswer = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { sessionId } = req.params;
  const { questionId, answer, timeSpent } = req.body;

  console.log(
    `📝 Submitting answer: Session ${sessionId}, Question ${questionId}`,
  );

  // Verify session ownership
  const session = await AssessmentSession.findOne({
    sessionId,
    userId,
  });

  if (!session) {
    throw new AppError('Session not found', 404);
  }

  const result = await assessmentService.submitAnswer(
    sessionId,
    questionId,
    answer,
    timeSpent,
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Complete assessment session
 * POST /api/assessments/sessions/:sessionId/complete
 */
const completeAssessment = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { sessionId } = req.params;
  const { finalAnswers } = req.body;

  console.log(`🏁 Completing assessment session: ${sessionId}`);

  // Verify session ownership
  const session = await AssessmentSession.findOne({
    sessionId,
    userId,
  });

  if (!session) {
    throw new AppError('Session not found', 404);
  }

  const results = await assessmentService.completeAssessment(
    sessionId,
    finalAnswers,
  );

  // If eligible for certificate, generate it automatically
  if (results.certificateEligible) {
    try {
      const certificate = await certificateService.generateCertificate(
        userId,
        session.assessmentId,
      );

      results.certificate = certificate.getSummary();
    } catch (error) {
      console.error('Failed to generate certificate:', error);
      // Don't fail the assessment completion due to certificate generation failure
      results.certificateError =
        'Certificate generation failed - please contact support';
    }
  }

  res.status(200).json({
    success: true,
    data: results,
  });
});

/**
 * Plan 3 tailored assessments based on intake
 * POST /api/assessments/plan
 */
const planCustomAssessments = catchAsync(async (req, res) => {
  // Get userId from various sources
  let userId = req.userId || req.user?._id || req.body.userId;
  
  // Validate and handle different user ID formats
  const mongoose = require('mongoose');
  if (!userId || userId === 'dev-user-id' || !mongoose.Types.ObjectId.isValid(userId)) {
    // Create or use a default test user for development
    const User = require('../models/User');
    let defaultUser = await User.findOne({ email: 'test@sokol.dev' });
    
    if (!defaultUser) {
      defaultUser = await User.create({
        clerkUserId: 'dev_user_' + Date.now(),
        email: 'test@sokol.dev',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: true,
      });
      console.log('📋 Created default test user:', defaultUser._id);
    }
    
    userId = defaultUser._id;
    console.log('📋 Using test user ID:', userId);
  }
  const {
    primaryDomain = 'Programming',
    subdomains = [],
    yearsExperience = '0-1',
    goals = 'baseline',
    preferredDifficulty = 'intermediate',
  } = req.body || {};

  // Create three assessment briefs: diagnostic, skills focus, stretch
  const prompt = `Create a personalized learning assessment plan for the following profile:
- Primary Domain: ${primaryDomain}
- Specific Areas: ${subdomains.length > 0 ? subdomains.join(', ') : 'general knowledge in ' + primaryDomain}
- Experience Level: ${yearsExperience} years
- Learning Goal: ${goals}
- Preferred Difficulty: ${preferredDifficulty}

Design exactly 3 progressive assessments:
1. Diagnostic Assessment: Establish baseline knowledge
2. Focused Skills Assessment: Deep dive into key competencies
3. Stretch Assessment: Challenge advanced understanding

Return a JSON object with an "assessments" array containing 3 items, each with:
- id: unique identifier (e.g., "diagnostic", "skills-focus", "stretch")
- title: descriptive title including the domain
- description: 1-2 sentence description of what this assessment covers
- targetSkills: array of 2-4 specific skills/topics to assess
- difficulty: "beginner" | "intermediate" | "advanced"
- questionCount: number between 5-10
- estimatedDurationMinutes: realistic time estimate
- rationale: why this assessment is valuable for this learner

Ensure the assessments are specifically tailored to ${primaryDomain} and progressively increase in complexity.`;

  let plan;
  let planWithIds;
  try {
    // Use the new AI Service Manager for better model selection and optimization
    plan = await aiServiceManager.generateAssessmentPlan(
      primaryDomain,
      subdomains,
      yearsExperience,
      goals,
      preferredDifficulty,
    );
    
    console.log('✅ Generated custom assessment plan:', plan.map(p => p.title));
    
    // Save generated assessments to database
    const savedAssessments = [];
    for (const assessment of plan) {
      // Check if assessment already exists (by title and userId)
      let existingAssessment = await Assessment.findOne({
        title: assessment.title,
        createdBy: userId,
      });
      
      if (!existingAssessment) {
        // Map primaryDomain to valid category
        const categoryMapping = {
          'Programming': 'Technical Skills',
          'React': 'Technical Skills',
          'JavaScript': 'Technical Skills',
          'Python': 'Technical Skills',
          'Java': 'Technical Skills',
          'Communication': 'Communication & Leadership',
          'Leadership': 'Communication & Leadership',
          'Business': 'Business Strategy',
          'Data Science': 'Data & Analytics',
          'Analytics': 'Data & Analytics',
          'Personal': 'Personal Development',
        };
        
        const validCategory = categoryMapping[primaryDomain] || 'Technical Skills';
        
        // Calculate points based on question count (10 points per question by default)
        const totalPoints = assessment.questionCount * 10;
        
        // Create new assessment in database
        const newAssessment = await Assessment.create({
          title: assessment.title,
          description: assessment.description,
          type: 'skill_check', // Default type for generated assessments
          category: validCategory,
          tags: assessment.targetSkills || [],
          difficulty: assessment.difficulty,
          totalQuestions: assessment.questionCount,
          scoring: {
            totalPoints: totalPoints,
            passingScore: 70, // Default 70% passing score
            perfectScore: 100,
            weightingMethod: 'equal',
          },
          timeConstraints: {
            totalTime: assessment.estimatedDurationMinutes,
            perQuestion: Math.ceil(assessment.estimatedDurationMinutes * 60 / assessment.questionCount),
          },
          scoringMethod: 'percentage',
          createdBy: userId,
          isPublished: true,
          isAIGenerated: true,
          metadata: {
            rationale: assessment.rationale,
            generatedForGoals: goals,
            generatedForExperience: yearsExperience,
            originalDomain: primaryDomain,
          },
        });
        
        savedAssessments.push(newAssessment);
        console.log(`💾 Saved assessment: ${newAssessment.title}`);
      } else {
        savedAssessments.push(existingAssessment);
        console.log(`📋 Assessment already exists: ${existingAssessment.title}`);
      }
    }
    
    // Return both the plan and the saved assessment IDs
    planWithIds = plan.map((p, index) => ({
      ...p,
      assessmentId: savedAssessments[index]?._id,
    }));
    
    console.log(`✅ Saved ${savedAssessments.length} assessments to database`);
    
  } catch (e) {
    console.error('❌ Error generating plan:', e.message);
    
    // Return error to user instead of fallback
    return res.status(500).json({
      success: false,
      error: 'Failed to generate assessment plan',
      message: e.message,
      hint: 'Please check AI service configuration',
    });
    
  }

  res.status(200).json({
    success: true,
    data: { 
      userId, 
      plan: planWithIds || plan,
      message: 'Assessment plan generated and saved successfully',
    },
  });
});

/**
 * Pause assessment session
 * POST /api/assessments/sessions/:sessionId/pause
 */
const pauseSession = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { sessionId } = req.params;

  console.log(`⏸️ Pausing assessment session: ${sessionId}`);

  const session = await AssessmentSession.findOne({
    sessionId,
    userId,
  });

  if (!session) {
    throw new AppError('Session not found', 404);
  }

  await session.pause();

  res.status(200).json({
    success: true,
    data: {
      message: 'Session paused successfully',
      sessionId: session.sessionId,
      status: session.status,
    },
  });
});

/**
 * Resume assessment session
 * POST /api/assessments/sessions/:sessionId/resume
 */
const resumeSession = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { sessionId } = req.params;

  console.log(`▶️ Resuming assessment session: ${sessionId}`);

  const session = await AssessmentSession.findOne({
    sessionId,
    userId,
  });

  if (!session) {
    throw new AppError('Session not found', 404);
  }

  await session.resume();

  res.status(200).json({
    success: true,
    data: {
      message: 'Session resumed successfully',
      sessionId: session.sessionId,
      status: session.status,
    },
  });
});

/**
 * Get assessment results
 * GET /api/assessments/sessions/:sessionId/results
 */
const getAssessmentResults = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { sessionId } = req.params;

  console.log(`📊 Getting assessment results: ${sessionId}`);

  const session = await AssessmentSession.findOne({
    sessionId,
    userId,
  }).populate('assessmentId', 'title type category attemptSettings');

  if (!session) {
    throw new AppError('Session not found', 404);
  }

  if (session.status !== 'completed') {
    throw new AppError('Assessment not completed yet', 400);
  }

  // Check if user is allowed to see results
  const showResults = session.assessmentId.attemptSettings.showResults;
  if (showResults === 'never') {
    throw new AppError('Results not available for this assessment', 403);
  }

  // Get detailed results
  const results = {
    session: session.getSummary(),
    assessment: {
      id: session.assessmentId._id,
      title: session.assessmentId.title,
      type: session.assessmentId.type,
      category: session.assessmentId.category,
    },
    results: session.results,
    answers: session.assessmentId.attemptSettings.allowReview
      ? session.answers.map((answer) => ({
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        isCorrect: answer.isCorrect,
        pointsEarned: answer.pointsEarned,
        maxPoints: answer.maxPoints,
        timeSpent: answer.timeSpent,
        feedback: answer.aiEvaluation?.feedback,
      }))
      : undefined,
  };

  res.status(200).json({
    success: true,
    data: results,
  });
});

/**
 * Get user's assessment history
 * GET /api/assessments/history
 */
const getAssessmentHistory = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { status, limit = 20, offset = 0 } = req.query;

  console.log(`📚 Getting assessment history for user: ${userId}`);

  const query = { userId };
  if (status) query.status = status;

  const sessions = await AssessmentSession.find(query)
    .populate('assessmentId', 'title type category')
    .sort({ startTime: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset))
    .lean();

  const total = await AssessmentSession.countDocuments(query);

  const history = sessions.map((session) => ({
    sessionId: session.sessionId,
    assessment: {
      id: session.assessmentId._id,
      title: session.assessmentId.title,
      type: session.assessmentId.type,
      category: session.assessmentId.category,
    },
    attemptNumber: session.attemptNumber,
    status: session.status,
    startTime: session.startTime,
    endTime: session.endTime,
    duration: Math.round(
      ((session.endTime || new Date()) - session.startTime) / (1000 * 60),
    ), // minutes
    results: session.results
      ? {
        finalScore: session.results.finalScore,
        passed: session.results.passed,
        grade: session.results.grade,
      }
      : null,
  }));

  res.status(200).json({
    success: true,
    data: {
      history,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total,
      },
    },
  });
});

/**
 * Get assessment analytics for user
 * GET /api/assessments/analytics
 */
const getAssessmentAnalytics = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { timeRange = '30d' } = req.query;

  console.log(`📈 Getting assessment analytics for user: ${userId}`);

  // Get user's assessment sessions
  const dateThreshold = new Date();
  switch (timeRange) {
  case '7d':
    dateThreshold.setDate(dateThreshold.getDate() - 7);
    break;
  case '30d':
    dateThreshold.setDate(dateThreshold.getDate() - 30);
    break;
  case '90d':
    dateThreshold.setDate(dateThreshold.getDate() - 90);
    break;
  case '1y':
    dateThreshold.setFullYear(dateThreshold.getFullYear() - 1);
    break;
  }

  const analytics = await AssessmentSession.aggregate([
    {
      $match: {
        userId: userId,
        startTime: { $gte: dateThreshold },
      },
    },
    {
      $lookup: {
        from: 'assessments',
        localField: 'assessmentId',
        foreignField: '_id',
        as: 'assessment',
      },
    },
    {
      $unwind: '$assessment',
    },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        completedAttempts: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        passedAttempts: {
          $sum: { $cond: ['$results.passed', 1, 0] },
        },
        averageScore: { $avg: '$results.finalScore' },
        totalTimeSpent: { $sum: '$timeTracking.totalTimeSpent' },
        categoriesAttempted: { $addToSet: '$assessment.category' },
        difficultyLevels: { $addToSet: '$assessment.difficulty' },
        assessmentTypes: { $addToSet: '$assessment.type' },
      },
    },
  ]);

  const result = analytics[0] || {
    totalAttempts: 0,
    completedAttempts: 0,
    passedAttempts: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    categoriesAttempted: [],
    difficultyLevels: [],
    assessmentTypes: [],
  };

  // Calculate additional metrics
  const passRate =
    result.completedAttempts > 0
      ? (result.passedAttempts / result.completedAttempts) * 100
      : 0;

  const completionRate =
    result.totalAttempts > 0
      ? (result.completedAttempts / result.totalAttempts) * 100
      : 0;

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalAttempts: result.totalAttempts,
        completedAttempts: result.completedAttempts,
        passedAttempts: result.passedAttempts,
        averageScore: Math.round(result.averageScore * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100,
        totalTimeSpent: Math.round(result.totalTimeSpent / 60), // convert to hours
      },
      categories: {
        attempted: result.categoriesAttempted.length,
        list: result.categoriesAttempted,
      },
      difficulty: {
        levels: result.difficultyLevels,
      },
      types: {
        attempted: result.assessmentTypes,
      },
      timeRange,
    },
  });
});

/**
 * Submit feedback on assessment
 * POST /api/assessments/:assessmentId/feedback
 */
const submitAssessmentFeedback = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { assessmentId } = req.params;
  const { rating, difficulty, comments, suggestions } = req.body;

  console.log(`💬 Submitting assessment feedback: ${assessmentId}`);

  // Verify user has completed the assessment
  const session = await AssessmentSession.findOne({
    userId,
    assessmentId,
    status: 'completed',
  });

  if (!session) {
    throw new AppError(
      'Can only provide feedback after completing assessment',
      400,
    );
  }

  // In a real implementation, you would store this feedback
  // For now, we'll just acknowledge receipt
  console.log('Assessment feedback received:', {
    userId,
    assessmentId,
    rating,
    difficulty,
    comments: comments?.substring(0, 100),
    suggestions: suggestions?.substring(0, 100),
  });

  res.status(200).json({
    success: true,
    data: {
      message:
        'Thank you for your feedback! It helps us improve our assessments.',
      feedbackId: `feedback_${Date.now()}`,
    },
  });
});

module.exports = {
  getAvailableAssessments,
  getAssessmentDetails,
  startAssessment,
  getSessionStatus,
  submitAnswer,
  completeAssessment,
  pauseSession,
  resumeSession,
  getAssessmentResults,
  getAssessmentHistory,
  getAssessmentAnalytics,
  submitAssessmentFeedback,
  planCustomAssessments,
};
