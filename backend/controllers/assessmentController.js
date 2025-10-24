const Assessment = require('../models/Assessment');
const AssessmentSession = require('../models/AssessmentSession');
const User = require('../models/User');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { aiServiceManager } = require('../services/aiServiceManager');
const { openAIService } = require('../services/openaiService');
const { AI_MODELS } = require('../config/aiModelConfig');

const getAvailableAssessments = catchAsync(async (req, res) => {
  let userId = req.user?._id || req.userId || req.headers['user-id'];
  
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    const defaultUser = await User.findOne({ email: 'test@sokol.dev' });
    if (!defaultUser) {
      return res.status(200).json({
        success: true,
        data: { assessments: [], totalCount: 0, hasMore: false },
      });
    }
    userId = defaultUser._id;
  }
  
  const { category, difficulty, type, limit = 20, offset = 0 } = req.query;


  const filters = {
    isActive: true,
    isPublished: true,
  };

  if (category) filters.category = category;
  if (difficulty && difficulty !== 'all') filters.difficulty = difficulty;
  if (type) filters.type = type;

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
    // Certificate service disabled - show as not eligible for now
    certificateInfo = {
      eligible: false,
      reason: 'Certificate service temporarily disabled',
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

  const sessionData = await createAssessmentSessionInternal(
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

  const result = await submitAnswerInternal(
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

  const results = await completeAssessmentInternal(
    sessionId,
    finalAnswers,
  );

  // Certificate generation disabled
  if (results.certificateEligible) {
    console.log('Certificate generation temporarily disabled');
    results.certificateError = 'Certificate generation temporarily unavailable';
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
  const _prompt = `Create a personalized learning assessment plan for the following profile:
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

// ============================================================================
// AI EVALUATION FUNCTIONS (merged from assessmentEvaluationController)
// ============================================================================

// AI Personality configurations
const AI_PERSONALITIES = {
  ARIA: {
    name: 'ARIA',
    style: 'encouraging and supportive',
    systemPrompt: `You are ARIA, an encouraging and supportive AI learning assistant. Your role is to:
    - Provide warm, motivational feedback
    - Focus on what the student did well
    - Gently guide them towards improvement
    - Use positive reinforcement
    - Be patient and empathetic
    - Celebrate effort as much as accuracy
    Always maintain an uplifting and encouraging tone.`,
    traits: ['Motivational', 'Patient', 'Empathetic'],
  },
  SAGE: {
    name: 'SAGE',
    style: 'analytical and detailed',
    systemPrompt: `You are SAGE, an analytical and thorough AI learning assistant. Your role is to:
    - Provide comprehensive, detailed analysis
    - Focus on underlying principles and concepts
    - Give thorough explanations of correct and incorrect aspects
    - Reference relevant theories and best practices
    - Provide deep insights into the subject matter
    - Suggest additional resources for learning
    Always maintain a professional and educational tone.`,
    traits: ['Precise', 'Thorough', 'Knowledgeable'],
  },
  COACH: {
    name: 'COACH',
    style: 'motivational and goal-oriented',
    systemPrompt: `You are COACH, a dynamic and results-focused AI learning assistant. Your role is to:
    - Push students towards excellence
    - Set high standards and expectations
    - Provide direct, actionable feedback
    - Focus on performance improvement
    - Challenge students to reach their potential
    - Emphasize achievement and mastery
    Always maintain an energetic and challenging tone.`,
    traits: ['Dynamic', 'Results-focused', 'Challenging'],
  },
};

/**
 * Evaluate a text/paragraph answer using AI
 * POST /api/assessments/evaluate
 */
const evaluateAnswer = catchAsync(async (req, res) => {
  const {
    question,
    answer,
    personality = 'ARIA',
    difficulty: rawDifficulty = 'medium',
    points = 10,
    rubric = null,
    context = null,
  } = req.body;

  // Normalize 4-level difficulty to 3-level scale
  const difficulty = (
    rawDifficulty === 'beginner' ? 'easy' :
      rawDifficulty === 'intermediate' ? 'medium' :
        rawDifficulty === 'advanced' || rawDifficulty === 'expert' ? 'hard' :
          rawDifficulty
  );

  // Validate inputs
  if (!question || !answer) {
    throw new AppError('Question and answer are required', 400);
  }

  if (!AI_PERSONALITIES[personality]) {
    throw new AppError('Invalid AI personality selected', 400);
  }

  const selectedPersonality = AI_PERSONALITIES[personality];

  // Build the evaluation prompt
  const evaluationPrompt = `
  You are evaluating a student's answer to an assessment question.
  
  Question: ${question}
  Student's Answer: ${answer}
  Difficulty Level: ${difficulty}
  Maximum Points: ${points}
  ${rubric ? `Evaluation Rubric: ${rubric}` : ''}
  ${context ? `Additional Context: ${context}` : ''}
  
  Please evaluate the answer and provide:
  1. A score out of ${points} points
  2. Detailed feedback in your characteristic ${selectedPersonality.style} style
  3. Key strengths in the answer
  4. Areas for improvement
  5. Suggestions for further learning
  
  Format your response as JSON with the following structure:
  {
    "score": <number between 0 and ${points}>,
    "feedback": "<detailed feedback in your style>",
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"],
    "suggestions": ["suggestion1", "suggestion2"],
    "overallAssessment": "<brief overall assessment>"
  }
  `;

  try {
    // Call OpenAI for evaluation
    const { openAIService } = require('../services/openaiService');
    const completion = await openAIService.createChatCompletion(
      [
        { role: 'system', content: selectedPersonality.systemPrompt },
        { role: 'user', content: evaluationPrompt },
      ],
      {
        model: AI_MODELS.OPENAI_GPT4.model,
        temperature: 0.7,
        maxTokens: 600,
      },
    );

    let evaluationResult;
    try {
      evaluationResult = JSON.parse(completion.content);
    } catch (_parseError) {
      // Fallback if JSON parsing fails
      evaluationResult = {
        score: Math.floor(points * 0.7),
        feedback: completion.content,
        strengths: ['Shows understanding of the topic'],
        improvements: ['Could provide more detail'],
        suggestions: ['Review the material and practice more'],
        overallAssessment: 'Good effort with room for improvement',
      };
    }

    // Add personality-specific encouragement
    const personalityMessages = {
      ARIA: [
        'Keep up the great work! Every step forward is progress! 🌟',
        'You\'re doing amazingly! I believe in your potential! 💪',
        'Your effort is truly inspiring! Keep learning and growing! 🚀',
      ],
      SAGE: [
        'Your analytical approach shows promise. Continue exploring the depths of this subject.',
        'Consider the theoretical implications of your answer for deeper understanding.',
        'This demonstrates solid foundational knowledge. Build upon it systematically.',
      ],
      COACH: [
        'Push yourself to the next level! Excellence is within reach!',
        'Champions are made through challenges like this! Keep pushing!',
        'You\'ve got what it takes to master this! Stay focused on the goal!',
      ],
    };

    const randomMessage = personalityMessages[personality][
      Math.floor(Math.random() * personalityMessages[personality].length)
    ];
    
    evaluationResult.personalityMessage = randomMessage;
    evaluationResult.personality = personality;

    res.status(200).json({
      success: true,
      data: evaluationResult,
    });
  } catch (error) {
    console.error('Error in evaluateAnswer:', error);
    // Safe fallback
    const fallbackScore = Math.floor(points * 0.65);
    return res.status(200).json({
      success: true,
      data: {
        score: fallbackScore,
        feedback: `Your answer shows understanding of the topic. ${selectedPersonality.style}.`,
        strengths: ['Shows effort', 'Addresses the question'],
        improvements: ['Provide more detail', 'Add concrete examples'],
        suggestions: ['Review the core concepts', 'Practice similar questions'],
        overallAssessment: 'Good attempt with room for growth',
        personalityMessage: 'Keep working hard! You\'re on the right path!',
        personality,
        isFallback: true,
      },
    });
  }
});

/**
 * Evaluate multiple choice answer
 * POST /api/assessments/evaluate-mc
 */
const evaluateMultipleChoice = catchAsync(async (req, res) => {
  const {
    question: _question,
    selectedAnswer,
    correctAnswer,
    options: _options,
    personality = 'ARIA',
    points = 10,
  } = req.body;

  const isCorrect = selectedAnswer === correctAnswer;
  const earnedPoints = isCorrect ? points : 0;

  // Generate personality-specific feedback
  let feedback;
  if (isCorrect) {
    feedback = {
      ARIA: 'Excellent work! You got it right! Your understanding is growing stronger! 🎉',
      SAGE: 'Correct. This demonstrates a solid grasp of the underlying concept. Well reasoned.',
      COACH: 'YES! That\'s what I\'m talking about! You nailed it! Keep this momentum going!',
    }[personality];
  } else {
    feedback = {
      ARIA: `Not quite right, but that's okay! The correct answer was "${correctAnswer}". Every mistake is a learning opportunity! Keep trying! 💪`,
      SAGE: `Incorrect. The correct answer is "${correctAnswer}". Let's analyze why this is the case and understand the underlying principles.`,
      COACH: `Wrong answer! The correct one was "${correctAnswer}". Champions learn from mistakes. Analyze, adapt, and come back stronger!`,
    }[personality];
  }

  res.status(200).json({
    success: true,
    data: {
      correct: isCorrect,
      score: earnedPoints,
      feedback: feedback,
      correctAnswer: correctAnswer,
      personality: personality,
    },
  });
});

// ============================================================================
// QUESTION GENERATION FUNCTIONS (merged from questionGenerationController.js)
// ============================================================================

/**
 * Generate assessment questions using AI based on topic and difficulty
 */
const generateQuestions = async (req, res, next) => {
  try {
    const {
      assessmentId,
      title,
      category,
      difficulty: rawDifficulty = 'intermediate',
      questionCount = 10,
      includeTypes = ['multiple_choice'], // Only multiple choice questions
      topic,
      subtopics: _subtopics = [],
    } = req.body;
    const wantStream = req.query.stream === '1' || req.headers.accept === 'text/event-stream';

    // Normalize difficulty to easy/medium/hard for consistent scoring/prompts
    const difficulty = (
      rawDifficulty === 'beginner' ? 'easy' :
        rawDifficulty === 'intermediate' ? 'medium' :
          (rawDifficulty === 'advanced' || rawDifficulty === 'expert') ? 'hard' :
            rawDifficulty
    );

    // Validate inputs
    if (!title || !category) {
      throw new AppError('Title and category are required', 400);
    }

    // Non-streaming mode (default): generate all at once
    if (!wantStream) {
      let questions;
      try {
        questions = await aiServiceManager.generateQuestions(
          title,
          category,
          topic || title,
          difficulty,
          questionCount,
          includeTypes,
          { subtopics: _subtopics },
        );
        console.log(`✅ Successfully generated ${questions.length} questions`);
      } catch (aiError) {
        console.error('❌ Question generation failed:', aiError.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to generate questions',
          message: aiError.message,
          hint: 'Check AI service configuration',
        });
      }

      if (!questions || questions.length === 0) {
        console.warn('⚠️ AI did not return any valid questions – generating fallback questions');
        questions = generateFallbackQuestions(title, category, difficulty, questionCount);
      }

      questions = questions.map((q, index) => ({
        ...q,
        id: `${assessmentId}_q${index + 1}`,
        difficulty: q.difficulty || difficulty,
        points: q.points || (difficulty === 'easy' ? 5 : difficulty === 'hard' ? 15 : 10),
        timeLimit: q.timeLimit || 300,
      }));

      return res.status(200).json({
        success: true,
        data: {
          assessmentId,
          questions,
          totalQuestions: questions.length,
          totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
          estimatedDuration: Math.ceil(questions.reduce((sum, q) => sum + (q.timeLimit || 300), 0) / 60),
        },
      });
    }

    // Streaming mode: send first 5, then stream the rest in batches
    const totalCount = Math.min(parseInt(questionCount, 10) || 10, 40);
    const chunkSize = Math.max(1, Math.min(parseInt(req.query.chunkSize, 10) || 5, 10));
    const topicText = topic || title;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders && res.flushHeaders();

    function sse(obj) {
      try {
        res.write(`data:${JSON.stringify(obj)}\n\n`);
      } catch (_) {
        // ignore write errors
      }
    }

    // Send init event
    sse({ type: 'init', payload: { assessmentId, totalQuestions: totalCount, chunkSize } });

    const allQuestions = [];
    const seenQuestions = new Set();
    let generated = 0;

    async function generateBatch(batchCount) {
      const avoid = Array.from(seenQuestions);
      let batch = [];
      try {
        batch = await aiServiceManager.generateQuestions(
          title,
          category,
          topicText,
          difficulty,
          batchCount,
          includeTypes,
          { avoidQuestions: avoid, subtopics: _subtopics },
        );
      } catch (err) {
        console.error('❌ Batch generation failed:', err.message);
        return [];
      }

      if (!batch || batch.length === 0) {
        // try fallback for this batch
        batch = generateFallbackQuestions(title, category, difficulty, batchCount);
      }

      const mapped = batch.map((q, i) => {
        const idx = generated + i;
        return {
          ...q,
          id: `${assessmentId}_q${idx + 1}`,
          difficulty: q.difficulty || difficulty,
          points: q.points || (difficulty === 'easy' ? 5 : difficulty === 'hard' ? 15 : 10),
          timeLimit: q.timeLimit || 300,
        };
      });

      // track seen
      for (const q of mapped) {
        if (q && typeof q.question === 'string') seenQuestions.add(q.question);
      }

      return mapped;
    }

    try {
      // First chunk
      const firstCount = Math.min(chunkSize, totalCount);
      const firstBatch = await generateBatch(firstCount);
      allQuestions.push(...firstBatch);
      generated += firstBatch.length;
      sse({ type: 'batch', payload: { startIndex: 0, questions: firstBatch } });

      // Remaining chunks
      while (generated < totalCount) {
        const remaining = totalCount - generated;
        const nextCount = Math.min(chunkSize, remaining);
        const nextBatch = await generateBatch(nextCount);
        const startIndex = generated;
        allQuestions.push(...nextBatch);
        generated += nextBatch.length;
        sse({ type: 'batch', payload: { startIndex, questions: nextBatch } });
      }

      // Summary event
      const totalPoints = allQuestions.reduce((sum, q) => sum + (q.points || 0), 0);
      const estimatedDuration = Math.ceil(allQuestions.reduce((sum, q) => sum + (q.timeLimit || 300), 0) / 60);
      sse({ type: 'complete', payload: { totalQuestions: allQuestions.length, totalPoints, estimatedDuration } });
    } catch (streamErr) {
      console.error('❌ Streaming generation error:', streamErr);
      sse({ type: 'error', payload: { message: streamErr.message || 'Unknown error' } });
    } finally {
      res.end();
    }

  } catch (error) {
    console.error('Error generating questions:', error);
    next(error);
  }
};

/**
 * Generate fallback questions if AI fails
 */
function generateFallbackQuestions(title, category, difficulty, count) {
  const questions = [];
  
  for (let i = 1; i <= count; i++) {
    // Create 4 options
    const options = [
      `Core concept A related to ${title}`,
      `Core concept B related to ${title}`,
      `Core concept C related to ${title}`,
      `Core concept D related to ${title}`,
    ];
    
    // Randomly select which option is correct (0-3)
    const correctIndex = Math.floor(Math.random() * 4);
    const correctAnswer = options[correctIndex];
    
    questions.push({
      id: `q${i}`,
      type: 'multiple_choice',
      question: `Question ${i}: What is a key concept in ${title}?`,
      options: options,
      correctAnswer: correctAnswer,
      points: difficulty === 'easy' ? 5 : difficulty === 'hard' ? 15 : 10,
      difficulty,
      timeLimit: 300,
      hints: [`Think about the fundamentals of ${category}`],
      explanation: `This tests your understanding of ${title} concepts. The correct answer is "${correctAnswer}".`,
    });
  }
  
  return questions;
}

/**
 * Regenerate a specific question
 */
const regenerateQuestion = async (req, res, next) => {
  try {
    const {
      questionId,
      currentQuestion,
      reason,
      preferences,
    } = req.body;

    const _prompt = `Regenerate this assessment question with improvements:

Current Question: ${currentQuestion.question}
Type: ${currentQuestion.type}
Reason for regeneration: ${reason || 'User requested a different question'}
${preferences ? `Preferences: ${preferences}` : ''}

Generate a new question that:
1. Tests the same concept differently
2. Maintains the same difficulty level (${currentQuestion.difficulty})
3. Uses the same question type
4. Avoids similarity to the original question

Provide the response in the same JSON format as before.`;

    const completion = await aiServiceManager.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert assessment designer. Create an alternative question that tests the same knowledge differently.',
        },
        {
          role: 'user',
          content: _prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000, // Increased from 500 to ensure complete questions
    });

    let newQuestion;
    try {
      newQuestion = JSON.parse(completion.choices[0].message.content);
    } catch (_parseError) {
      // Return a slightly modified version of the original
      newQuestion = {
        ...currentQuestion,
        question: `Alternative: ${currentQuestion.question}`,
        id: questionId,
      };
    }

    res.status(200).json({
      success: true,
      data: {
        question: {
          ...newQuestion,
          id: questionId,
        },
      },
    });

  } catch (error) {
    console.error('Error regenerating question:', error);
    next(error);
  }
};

// ============================================================================
// ASSESSMENT SERVICE FUNCTIONS (merged from assessmentService.js)
// ============================================================================



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
  evaluateAnswer,
  evaluateMultipleChoice,
  generateQuestions,
  regenerateQuestion,
};
