const LearningModule = require('../models/LearningModule');
const LearningPath = require('../models/LearningPath');
const UserProgress = require('../models/UserProgress');
const LearningSession = require('../models/LearningSession');
const User = require('../models/User');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { generateSessionId } = require('../utils/helpers');

// Get module by ID with personalized content
const getModule = catchAsync(async (req, res) => {
  const { moduleId } = req.params;

  const module = await LearningModule.findById(moduleId)
    .populate('pathId', 'title category difficulty')
    .lean();

  if (!module) {
    throw new AppError('Module not found', 404);
  }

  if (module.status !== 'published' || !module.isActive) {
    throw new AppError('Module is not available', 403);
  }

  // Check if user has access to this module
  let hasAccess = true;
  let accessReason = null;

  if (req.user && module.isLocked) {
    const userCompletedModules = await UserProgress.find({
      userId: req.user._id,
      moduleId: { $exists: true },
      'progress.completed': true,
    }).distinct('moduleId');

    const accessCheck = module.checkAccess(
      userCompletedModules.map((id) => id.toString()),
    );
    hasAccess = accessCheck.canAccess;
    accessReason = accessCheck.reason;
  }

  if (!hasAccess) {
    throw new AppError(accessReason || 'Access denied to this module', 403);
  }

  // Get user's progress for this module
  let userProgress = null;
  let adaptedContent = module.content;

  if (req.user) {
    userProgress = await UserProgress.findOne({
      userId: req.user._id,
      moduleId: moduleId,
    }).lean();

    // Get user's learning style and performance for adaptation
    const user = await User.findById(req.user._id).lean();
    const learningStyle = user.learningProfile.learningStyle;

    // Calculate user performance for adaptation
    const userPerformance = {};
    if (userProgress) {
      userPerformance.averageScore = userProgress.performance.averageScore || 0;
      userPerformance.engagementScore =
        userProgress.analytics.engagementScore || 50;
      userPerformance.timeSpentRatio =
        userProgress.analytics.totalTimeSpent / (module.content.duration || 1);
    }

    // Get adapted content based on learning style and performance
    adaptedContent = module.getAdaptedContent(learningStyle, userPerformance);
  }

  // Get navigation info (previous/next modules)
  const [previousModule, nextModule] = await Promise.all([
    LearningModule.getPreviousModule(module.pathId, module.order),
    LearningModule.getNextModule(module.pathId, module.order),
  ]);

  res.status(200).json({
    success: true,
    data: {
      module: {
        ...module,
        content: adaptedContent,
        userProgress,
        hasAccess,
        isCompleted: userProgress ? userProgress.progress.completed : false,
        lastAccessed: userProgress ? userProgress.progress.lastAccessed : null,
      },
      navigation: {
        previous: previousModule
          ? {
            id: previousModule._id,
            title: previousModule.title,
            order: previousModule.order,
          }
          : null,
        next: nextModule
          ? {
            id: nextModule._id,
            title: nextModule.title,
            order: nextModule.order,
          }
          : null,
      },
    },
  });
});

// Get all modules for a specific learning path
const getPathModules = catchAsync(async (req, res) => {
  const { pathId } = req.params;

  // Verify path exists
  const path = await LearningPath.findById(pathId);
  if (!path) {
    throw new AppError('Learning path not found', 404);
  }

  const modules = await LearningModule.getByPath(pathId);

  // Get user progress for all modules if authenticated
  let moduleProgress = {};
  if (req.user) {
    const progressData = await UserProgress.find({
      userId: req.user._id,
      pathId: pathId,
      moduleId: { $exists: true },
    }).lean();

    moduleProgress = progressData.reduce((acc, progress) => {
      acc[progress.moduleId.toString()] = progress;
      return acc;
    }, {});
  }

  // Enhanced modules with progress and access info
  const enhancedModules = modules.map((module) => {
    const progress = moduleProgress[module._id.toString()];

    return {
      id: module._id,
      title: module.title,
      description: module.shortDescription || module.description,
      order: module.order,
      duration: module.content.duration,
      difficulty: module.difficulty,
      type: module.content.type,
      hasAssessment: module.hasAssessment,
      isOptional: module.isOptional,
      isLocked: module.isLocked,
      userProgress: progress
        ? {
          percentage: progress.progress.percentage,
          completed: progress.progress.completed,
          timeSpent: progress.progress.timeSpent,
          lastAccessed: progress.progress.lastAccessed,
          engagementScore: progress.analytics?.engagementScore || 0,
        }
        : null,
      isCompleted: progress ? progress.progress.completed : false,
      canAccess: !module.isLocked, // Simplified for list view
    };
  });

  res.status(200).json({
    success: true,
    data: {
      path: {
        id: path._id,
        title: path.title,
        category: path.category,
        difficulty: path.difficulty,
      },
      modules: enhancedModules,
      summary: {
        total: modules.length,
        completed: enhancedModules.filter((m) => m.isCompleted).length,
        totalDuration: modules.reduce((sum, m) => sum + m.content.duration, 0),
      },
    },
  });
});

// Start a learning session for a module
const startSession = catchAsync(async (req, res) => {
  const { moduleId } = req.params;
  const { environment = 'other', initialMood = 'neutral' } = req.body;

  const module = await LearningModule.findById(moduleId);
  if (!module) {
    throw new AppError('Module not found', 404);
  }

  // Check module access
  if (module.status !== 'published' || !module.isActive) {
    throw new AppError('Module is not available', 403);
  }

  // Find or create user progress for this module
  let userProgress = await UserProgress.findOne({
    userId: req.user._id,
    moduleId: moduleId,
  });

  if (!userProgress) {
    userProgress = new UserProgress({
      userId: req.user._id,
      pathId: module.pathId,
      moduleId: moduleId,
      status: 'in_progress',
      enrollmentDate: new Date(),
    });
    await userProgress.save();
  }

  // Generate unique session ID
  const sessionId = generateSessionId();

  // Create learning session
  const session = new LearningSession({
    sessionId,
    userId: req.user._id,
    pathId: module.pathId,
    moduleId: moduleId,
    startTime: new Date(),
    status: 'active',
    learningObjectives: module.learningObjectives,
    userState: {
      initialMood,
      energyLevel: { initial: 5 },
    },
    environment: { location: environment },
    deviceInfo: {
      userAgent: req.get('User-Agent'),
      platform: req.get('X-Platform') || 'web',
      timezone: req.user.timezone,
    },
  });

  await session.save();

  // Add session start activity
  session.addActivity('session_start', {
    moduleId: moduleId,
    pathId: module.pathId,
  });
  await session.save();

  // Update user progress
  userProgress.progress.lastAccessed = new Date();
  userProgress.lastActivityDate = new Date();
  if (userProgress.progress.firstAccessed === null) {
    userProgress.progress.firstAccessed = new Date();
  }
  await userProgress.save();

  console.log(
    `✅ Session started for user ${req.user.email} on module: ${module.title}`,
  );

  res.status(201).json({
    success: true,
    message: 'Learning session started successfully',
    data: {
      sessionId,
      module: {
        id: module._id,
        title: module.title,
        duration: module.content.duration,
        type: module.content.type,
      },
      userProgress: {
        percentage: userProgress.progress.percentage,
        timeSpent: userProgress.progress.timeSpent,
      },
    },
  });
});

// Update module progress during session
const updateProgress = catchAsync(async (req, res) => {
  const { moduleId } = req.params;
  const {
    sessionId,
    progressPercentage,
    timeSpent,
    engagementScore,
    contentInteractions = [],
    strugglingAreas = [],
    notes = [],
  } = req.body;

  // Find the learning session
  const session = await LearningSession.findOne({
    sessionId,
    userId: req.user._id,
    moduleId: moduleId,
    status: { $in: ['active', 'paused'] },
  });

  if (!session) {
    throw new AppError('Active learning session not found', 404);
  }

  // Find user progress
  let userProgress = await UserProgress.findOne({
    userId: req.user._id,
    moduleId: moduleId,
  });

  if (!userProgress) {
    throw new AppError('User progress not found', 404);
  }

  // Update session with content interactions
  if (contentInteractions.length > 0) {
    contentInteractions.forEach((interaction) => {
      session.recordContentInteraction(interaction);
    });
  }

  // Add progress update activity
  session.addActivity('progress_update', {
    progressPercentage,
    timeSpent,
    engagementScore,
  });

  // Update user progress
  if (progressPercentage !== undefined) {
    userProgress.progress.percentage = Math.max(
      userProgress.progress.percentage,
      progressPercentage,
    );
  }

  if (timeSpent !== undefined) {
    userProgress.progress.timeSpent += timeSpent;
  }

  if (engagementScore !== undefined) {
    // Update engagement score (weighted average)
    const sessionCount = userProgress.analytics.sessionsCount || 1;
    const currentTotal =
      userProgress.analytics.engagementScore * (sessionCount - 1);
    userProgress.analytics.engagementScore =
      (currentTotal + engagementScore) / sessionCount;
  }

  userProgress.progress.lastAccessed = new Date();
  userProgress.lastActivityDate = new Date();

  // Handle struggling areas
  if (strugglingAreas.length > 0) {
    strugglingAreas.forEach((area) => {
      const existingWeakness = userProgress.performance.weaknesses.find(
        (w) => w.skill === area.skill,
      );

      if (existingWeakness) {
        existingWeakness.improvementNeeded = Math.max(
          existingWeakness.improvementNeeded,
          area.difficulty,
        );
      } else {
        userProgress.performance.weaknesses.push({
          skill: area.skill,
          improvementNeeded: area.difficulty,
          recommendedActions: area.recommendedActions || [],
        });
      }
    });
  }

  // Add notes if provided
  if (notes.length > 0) {
    notes.forEach((note) => {
      session.addNote(note.content, note.materialId, note.position);
    });
  }

  await Promise.all([session.save(), userProgress.save()]);

  res.status(200).json({
    success: true,
    message: 'Progress updated successfully',
    data: {
      progress: {
        percentage: userProgress.progress.percentage,
        timeSpent: userProgress.progress.timeSpent,
        engagementScore: userProgress.analytics.engagementScore,
      },
      recommendations: userProgress.getRecommendations(),
    },
  });
});

// Complete a module
const completeModule = catchAsync(async (req, res) => {
  const { moduleId } = req.params;
  const {
    sessionId,
    finalEngagementScore,
    finalMood = 'satisfied',
    feedback = {},
    finalEnergyLevel,
  } = req.body;

  const module = await LearningModule.findById(moduleId);
  if (!module) {
    throw new AppError('Module not found', 404);
  }

  // Find user progress
  const userProgress = await UserProgress.findOne({
    userId: req.user._id,
    moduleId: moduleId,
  });

  if (!userProgress) {
    throw new AppError('User progress not found', 404);
  }

  if (userProgress.progress.completed) {
    return res.status(200).json({
      success: true,
      message: 'Module already completed',
      data: {
        progress: userProgress,
        alreadyCompleted: true,
      },
    });
  }

  // Update session if provided
  if (sessionId) {
    const session = await LearningSession.findOne({
      sessionId,
      userId: req.user._id,
    });

    if (session) {
      session.status = 'completed';
      session.endTime = new Date();
      session.completionReason = 'natural_end';
      session.userState.finalMood = finalMood;
      if (finalEnergyLevel) {
        session.userState.energyLevel.final = finalEnergyLevel;
      }

      // Add feedback to session
      if (Object.keys(feedback).length > 0) {
        session.feedback = { ...session.feedback, ...feedback };
      }

      session.addActivity('session_end', { completed: true });
      await session.save();
    }
  }

  // Mark module as completed
  userProgress.progress.completed = true;
  userProgress.progress.percentage = 100;
  userProgress.progress.completedAt = new Date();
  userProgress.status = 'completed';

  // Add completion feedback
  if (Object.keys(feedback).length > 0) {
    userProgress.feedback = { ...userProgress.feedback, ...feedback };
  }

  await userProgress.save();

  // Update path-level progress
  const pathProgress = await UserProgress.findOne({
    userId: req.user._id,
    pathId: module.pathId,
    moduleId: { $exists: false },
  });

  if (pathProgress) {
    // Calculate overall path completion
    const allModules = await LearningModule.find({ pathId: module.pathId });
    const completedModules = await UserProgress.find({
      userId: req.user._id,
      pathId: module.pathId,
      moduleId: { $exists: true },
      'progress.completed': true,
    });

    const completionPercentage =
      (completedModules.length / allModules.length) * 100;
    pathProgress.progress.percentage = completionPercentage;

    if (completionPercentage === 100) {
      pathProgress.progress.completed = true;
      pathProgress.progress.completedAt = new Date();
      pathProgress.status = 'completed';

      // Update user and path statistics
      await Promise.all([
        User.findByIdAndUpdate(req.user._id, {
          $inc: { 'statistics.pathsCompleted': 1 },
        }),
        LearningPath.findByIdAndUpdate(module.pathId, {
          $inc: { 'metadata.studentsCompleted': 1 },
        }),
      ]);
    }

    await pathProgress.save();
  }

  // Get next module suggestion
  const nextModule = await LearningModule.getNextModule(
    module.pathId,
    module.order,
  );

  console.log(`✅ Module completed by user ${req.user.email}: ${module.title}`);

  res.status(200).json({
    success: true,
    message: 'Module completed successfully!',
    data: {
      progress: userProgress,
      pathCompletion: pathProgress
        ? {
          percentage: pathProgress.progress.percentage,
          completed: pathProgress.progress.completed,
        }
        : null,
      nextModule: nextModule
        ? {
          id: nextModule._id,
          title: nextModule.title,
          difficulty: nextModule.difficulty,
          duration: nextModule.content.duration,
        }
        : null,
      achievements: [], // Could add achievement logic here
    },
  });
});

// Get module assessment
const getModuleAssessment = catchAsync(async (req, res) => {
  const { moduleId } = req.params;

  const module = await LearningModule.findById(moduleId).lean();
  if (!module) {
    throw new AppError('Module not found', 404);
  }

  if (!module.hasAssessment || !module.assessment) {
    throw new AppError('No assessment available for this module', 404);
  }

  // Check if user has access
  const userProgress = await UserProgress.findOne({
    userId: req.user._id,
    moduleId: moduleId,
  });

  if (!userProgress) {
    throw new AppError(
      'You must start the module before taking assessment',
      403,
    );
  }

  // Prepare assessment (randomize questions if enabled)
  let questions = module.assessment.questions;

  if (module.assessment.randomizeQuestions) {
    questions = questions.sort(() => Math.random() - 0.5);
  }

  // Remove correct answers from questions for security
  const secureQuestions = questions.map((q) => ({
    _id: q._id,
    question: q.question,
    type: q.type,
    options:
      q.type === 'multiple_choice'
        ? q.options.map((opt) => ({
          _id: opt._id,
          text: opt.text,
        }))
        : undefined,
    points: q.points,
  }));

  res.status(200).json({
    success: true,
    data: {
      assessment: {
        questions: secureQuestions,
        passingScore: module.assessment.passingScore,
        maxAttempts: module.assessment.maxAttempts,
        timeLimit: module.assessment.timeLimit,
        totalQuestions: questions.length,
        totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
      },
      attempts: userProgress.performance.totalAssessmentAttempts,
      remainingAttempts:
        module.assessment.maxAttempts -
        userProgress.performance.totalAssessmentAttempts,
    },
  });
});

// Submit module assessment
const submitAssessment = catchAsync(async (req, res) => {
  const { moduleId } = req.params;
  const { answers, timeSpent = 0 } = req.body;

  const module = await LearningModule.findById(moduleId);
  if (!module) {
    throw new AppError('Module not found', 404);
  }

  if (!module.hasAssessment) {
    throw new AppError('No assessment available for this module', 404);
  }

  const userProgress = await UserProgress.findOne({
    userId: req.user._id,
    moduleId: moduleId,
  });

  if (!userProgress) {
    throw new AppError('User progress not found', 404);
  }

  // Check attempts limit
  if (
    userProgress.performance.totalAssessmentAttempts >=
    module.assessment.maxAttempts
  ) {
    throw new AppError('Maximum assessment attempts exceeded', 403);
  }

  // Calculate score
  let totalScore = 0;
  let totalPoints = 0;
  const results = [];

  module.assessment.questions.forEach((question) => {
    const userAnswer = answers[question._id.toString()];
    const isCorrect = checkAnswer(question, userAnswer);

    totalPoints += question.points;
    if (isCorrect) {
      totalScore += question.points;
    }

    results.push({
      questionId: question._id,
      question: question.question,
      userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      points: isCorrect ? question.points : 0,
      explanation: question.explanation,
    });
  });

  const scorePercentage = Math.round((totalScore / totalPoints) * 100);
  const passed = scorePercentage >= module.assessment.passingScore;

  // Record assessment result
  const attemptNumber = userProgress.performance.totalAssessmentAttempts + 1;
  await userProgress.recordAssessment({
    score: scorePercentage,
    timeSpent,
    attemptNumber,
  });

  res.status(200).json({
    success: true,
    message: passed
      ? 'Assessment passed successfully!'
      : 'Assessment completed. Review and try again.',
    data: {
      score: scorePercentage,
      passed,
      passingScore: module.assessment.passingScore,
      totalPoints,
      earnedPoints: totalScore,
      timeSpent,
      attempt: attemptNumber,
      remainingAttempts: module.assessment.maxAttempts - attemptNumber,
      results: module.assessment.showCorrectAnswers ? results : undefined,
    },
  });
});

// Helper function to check answer correctness
const checkAnswer = (question, userAnswer) => {
  switch (question.type) {
  case 'multiple_choice': {
    const correctOption = question.options.find((opt) => opt.isCorrect);
    return correctOption && correctOption._id.toString() === userAnswer;
  }

  case 'true_false':
    return question.correctAnswer === userAnswer;

  case 'short_answer':
    return (
      question.correctAnswer.toLowerCase().trim() ===
        userAnswer.toLowerCase().trim()
    );

  default:
    return false;
  }
};

// Pause learning session
const pauseSession = catchAsync(async (req, res) => {
  const { sessionId } = req.body;

  const session = await LearningSession.findOne({
    sessionId,
    userId: req.user._id,
    status: 'active',
  });

  if (!session) {
    throw new AppError('Active session not found', 404);
  }

  session.addActivity('session_pause');
  await session.save();

  res.status(200).json({
    success: true,
    message: 'Session paused successfully',
  });
});

// Resume learning session
const resumeSession = catchAsync(async (req, res) => {
  const { sessionId } = req.body;

  const session = await LearningSession.findOne({
    sessionId,
    userId: req.user._id,
    status: 'paused',
  });

  if (!session) {
    throw new AppError('Paused session not found', 404);
  }

  session.addActivity('session_resume');
  await session.save();

  res.status(200).json({
    success: true,
    message: 'Session resumed successfully',
  });
});

module.exports = {
  getModule,
  getPathModules,
  startSession,
  updateProgress,
  completeModule,
  getModuleAssessment,
  submitAssessment,
  pauseSession,
  resumeSession,
};
