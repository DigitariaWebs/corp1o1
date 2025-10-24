// seeders/comprehensiveSeeder.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Import all EXISTING models (removed AssessmentResult which doesn't exist)
const User = require('../models/User');
const LearningPath = require('../models/LearningPath');
const LearningModule = require('../models/LearningModule');
const UserProgress = require('../models/UserProgress');
// const LearningSession = require('../models/LearningSession'); // ❌ Removed - model deleted
// const AIPrompt = require('../models/AIPrompt'); // ❌ Removed - model deleted
const AISession = require('../models/AISession');
const Assessment = require('../models/Assessment');
const AssessmentSession = require('../models/AssessmentSession');
const Certificate = require('../models/Certificate');
// const LearningAnalytics = require('../models/LearningAnalytics'); // ❌ Removed - model deleted
// const AdaptationRule = require('../models/AdaptationRule'); // ❌ Removed - model deleted
// const RecommendationEngine = require('../models/RecommendationEngine'); // ❌ Removed - model deleted

// Utility functions
const getRandomElement = (array) =>
  array[Math.floor(Math.random() * array.length)];
const getRandomElements = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
};
const getRandomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max) => Math.random() * (max - min) + min;
const getRandomDate = (start, end) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Data arrays for realistic generation
const firstNames = [
  'Alex',
  'Jordan',
  'Taylor',
  'Morgan',
  'Casey',
  'Riley',
  'Avery',
  'Quinn',
  'Sage',
  'River',
  'Jamie',
  'Blake',
  'Drew',
  'Rowan',
  'Parker',
  'Dakota',
  'Skyler',
  'Emery',
  'Finley',
  'Hayden',
];
const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
];
const domains = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'company.com',
  'university.edu',
];
const learningStyles = ['visual', 'auditory', 'kinesthetic', 'reading'];
const aiPersonalities = ['ARIA', 'SAGE', 'COACH'];
const categories = [
  'Communication & Leadership',
  'Innovation & Creativity',
  'Technical Skills',
  'Business Strategy',
  'Personal Development',
  'Data & Analytics',
];
const difficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
const goals = [
  'Career Advancement',
  'Skill Development',
  'Personal Growth',
  'Certification',
  'Knowledge Expansion',
];
const interests = [
  'Technology',
  'Leadership',
  'Data Science',
  'Design',
  'Marketing',
  'Finance',
  'Project Management',
];

class ComprehensiveSeeder {
  constructor() {
    this.users = [];
    this.learningPaths = [];
    this.learningModules = [];
    this.assessments = [];
    this.aiPrompts = [];
    this.startDate = new Date('2024-01-01');
    this.endDate = new Date();
  }

  async run() {
    try {
      console.log('🌱 Starting comprehensive database seeding...');
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Database: ${process.env.MONGODB_URI}`);

      // Connect to database
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');

      // Clear existing data
      await this.clearDatabase();

      // Seed in order (maintaining relationships)
      await this.seedUsers();
      // await this.seedAIPrompts(); // ❌ Removed - model deleted
      // await this.seedAdaptationRules(); // ❌ Removed - model deleted
      await this.seedLearningPaths();
      await this.seedLearningModules();
      await this.seedAssessments();
      await this.seedUserProgress();
      // await this.seedLearningSessions(); // ❌ Removed - model deleted
      await this.seedAISessions();
      await this.seedAssessmentSessions();
      await this.seedCertificates();
      // await this.seedLearningAnalytics(); // ❌ Removed - model deleted
      // await this.seedRecommendations(); // ❌ Removed - model deleted

      await this.displaySummary();
      console.log('🎉 Comprehensive database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Error during seeding:', error);
      throw error;
    } finally {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  async clearDatabase() {
    console.log('🗑️ Clearing existing data...');
    const collections = [
      User,
      LearningPath,
      LearningModule,
      UserProgress,
      // LearningSession, // ❌ Removed - model deleted
      // AIPrompt, // ❌ Removed - model deleted
      AISession,
      Assessment,
      AssessmentSession,
      Certificate,
      // LearningAnalytics, // ❌ Removed - model deleted
      // AdaptationRule, // ❌ Removed - model deleted
      // RecommendationEngine, // ❌ Removed - model deleted
    ];

    for (const Model of collections) {
      await Model.deleteMany({});
    }
    console.log('✅ Database cleared');
  }

  async seedUsers() {
    console.log('👥 Seeding users...');
    const usersData = [];

    // Create admin user
    usersData.push({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@sokol-learning.com',
      password: await bcrypt.hash('admin123', 12),
      role: 'admin',
      isEmailVerified: true,
      profileImage: 'https://ui-avatars.com/api/?name=Admin+User',
      learningProfile: {
        learningStyle: 'reading',
        aiPersonality: 'SAGE',
        goals: ['Business Strategy', 'Data & Analytics'],
        interests: ['Technology', 'Leadership'],
        pace: 'fast',
        preferredSessionLength: 60,
        difficultyAdjustment: 1,
        hintsEnabled: false,
        preferredFormat: 'comprehensive',
        aiPreferences: {
          tone: 'professional',
          supportLevel: 'minimal',
          explanationDepth: 'detailed',
        },
      },
      isActive: true,
    });

    // Create demo instructor
    usersData.push({
      firstName: 'Sarah',
      lastName: 'Mitchell',
      email: 'instructor@sokol-learning.com',
      password: await bcrypt.hash('instructor123', 12),
      role: 'instructor',
      isEmailVerified: true,
      profileImage: 'https://ui-avatars.com/api/?name=Sarah+Mitchell',
      bio: 'Expert educator with 10+ years of experience in adaptive learning',
      learningProfile: {
        learningStyle: 'visual',
        aiPersonality: 'COACH',
        goals: ['Personal Development', 'Innovation & Creativity'],
        interests: ['Education', 'Technology', 'Design'],
        pace: 'moderate',
        preferredSessionLength: 45,
      },
      isActive: true,
    });

    // Create demo student
    usersData.push({
      firstName: 'Demo',
      lastName: 'Student',
      email: 'demo@sokol-learning.com',
      password: await bcrypt.hash('password123', 12),
      role: 'user',
      isEmailVerified: true,
      profileImage: 'https://ui-avatars.com/api/?name=Demo+Student',
      bio: 'Passionate learner exploring new technologies',
      learningProfile: {
        learningStyle: 'visual',
        aiPersonality: 'ARIA',
        goals: ['Career Advancement', 'Skill Development'],
        interests: ['Technology', 'Data Science'],
        pace: 'moderate',
        preferredSessionLength: 30,
        difficultyAdjustment: 0,
        hintsEnabled: true,
        preferredFormat: 'interactive',
        aiPreferences: {
          tone: 'friendly',
          supportLevel: 'high',
          explanationDepth: 'moderate',
        },
      },
      isActive: true,
    });

    // Create 47 random users for realistic data
    for (let i = 0; i < 47; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomNumber(
        1,
        999,
      )}@${getRandomElement(domains)}`;

      usersData.push({
        firstName,
        lastName,
        email,
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        isEmailVerified: Math.random() > 0.2,
        profileImage: `https://ui-avatars.com/api/?name=${firstName}+${lastName}`,
        bio:
          Math.random() > 0.5
            ? `${firstName} is passionate about continuous learning and growth.`
            : undefined,
        learningProfile: {
          learningStyle: getRandomElement(learningStyles),
          aiPersonality: getRandomElement(aiPersonalities),
          goals: getRandomElements(goals, getRandomNumber(1, 3)),
          interests: getRandomElements(interests, getRandomNumber(2, 4)),
          pace: getRandomElement(['slow', 'moderate', 'fast']),
          preferredSessionLength: getRandomElement([15, 30, 45, 60]),
          difficultyAdjustment: getRandomNumber(-1, 1),
          hintsEnabled: Math.random() > 0.3,
          preferredFormat: getRandomElement([
            'video',
            'text',
            'interactive',
            'mixed',
          ]),
          aiPreferences: {
            tone: getRandomElement([
              'friendly',
              'professional',
              'encouraging',
              'direct',
            ]),
            supportLevel: getRandomElement(['minimal', 'moderate', 'high']),
            explanationDepth: getRandomElement([
              'concise',
              'moderate',
              'detailed',
            ]),
          },
        },
        isActive: Math.random() > 0.1,
        subscription:
          Math.random() > 0.7
            ? {
              plan: getRandomElement(['basic', 'premium', 'enterprise']),
              status: 'active',
              expiresAt: new Date(
                Date.now() + getRandomNumber(30, 365) * 24 * 60 * 60 * 1000,
              ),
            }
            : undefined,
      });
    }

    this.users = await User.insertMany(usersData);
    console.log(`✅ Created ${this.users.length} users`);
  }

  async seedAIPrompts() {
    console.log('🤖 Seeding AI prompts...');
    const promptsData = [];

    // Create prompts for each personality and context type
    const personalities = ['ARIA', 'SAGE', 'COACH'];
    const contextTypes = [
      'learning_help',
      'motivation',
      'assessment_feedback',
      'progress_review',
      'module_introduction',
      'concept_explanation',
      'skill_guidance',
      'encouragement',
      'challenge',
      'reflection',
      'goal_setting',
    ];

    for (const personality of personalities) {
      for (const contextType of contextTypes) {
        const template = this.generatePromptTemplate(personality, contextType);
        promptsData.push({
          name: `${personality}_${contextType}`,
          description: `${personality} personality prompt for ${contextType.replace(
            /_/g,
            ' ',
          )} context`,
          personality,
          contextType,
          modelType: 'openai-gpt4',
          systemPrompt: template.systemPrompt,
          userPromptTemplate: template.userPromptTemplate,
          contextVariables: this.getContextVariables(contextType),
          responseConfig: {
            maxTokens: getRandomNumber(300, 800),
            temperature: getRandomFloat(0.5, 0.9),
            topP: 1,
            frequencyPenalty: 0,
            presencePenalty: 0,
          },
          adaptationRules: this.generateAdaptationRules(contextType),
          performanceMetrics: {
            useCount: getRandomNumber(0, 1000),
            averageRating: getRandomFloat(3.5, 5),
            ratingCount: getRandomNumber(0, 500),
            effectivenessScore: getRandomFloat(60, 95),
            averageResponseTime: getRandomNumber(500, 2000),
            successRate: getRandomFloat(70, 98),
          },
          isActive: true,
          isDefault: Math.random() > 0.7,
          learningDomains: getRandomElements(categories, getRandomNumber(1, 3)),
          targetDifficulty: getRandomElement(['any', ...difficulties]),
        });
      }
    }

    this.aiPrompts = await AIPrompt.insertMany(promptsData);
    console.log(`✅ Created ${this.aiPrompts.length} AI prompts`);
  }

  async seedAdaptationRules() {
    console.log('⚙️ Seeding adaptation rules...');
    const rulesData = [];

    const ruleTemplates = [
      {
        name: 'Struggling User Support',
        category: 'intervention',
        type: 'trigger',
        triggerConditions: {
          performance: { maxAverageScore: 60, consecutiveFailures: 2 },
          engagement: { minFocusScore: 40 },
        },
        adaptationActions: {
          content: { adjustDifficulty: 'decrease', enableHints: true },
          aiPersonality: {
            adjustTone: 'more_encouraging',
            increaseSupport: true,
          },
        },
      },
      {
        name: 'High Performer Challenge',
        category: 'content_difficulty',
        type: 'trigger',
        triggerConditions: {
          performance: { minAverageScore: 90, minCompletionRate: 80 },
          engagement: { minFocusScore: 75 },
        },
        adaptationActions: {
          content: {
            adjustDifficulty: 'increase',
            addSupplementaryResources: true,
          },
          recommendations: {
            suggestNewPath: true,
            proposeAlternativeModule: true,
          },
        },
      },
      {
        name: 'Low Engagement Alert',
        category: 'engagement',
        type: 'continuous',
        triggerConditions: {
          engagement: { maxFocusScore: 30, maxSessionsPerWeek: 2 },
        },
        adaptationActions: {
          intervention: { sendNotification: true, scheduleCheckin: true },
          pace: { suggestBreak: true, adjustSessionLength: 'shorter' },
        },
      },
    ];

    for (const template of ruleTemplates) {
      rulesData.push({
        ...template,
        description: `Adaptation rule for ${template.name.toLowerCase()}`,
        configuration: {
          priority: getRandomNumber(1, 10),
          cooldownPeriod: getRandomNumber(12, 48),
          maxTriggersPerUser: getRandomNumber(5, 20),
          effectiveness: {
            successRate: getRandomFloat(60, 90),
            totalTriggers: getRandomNumber(0, 1000),
            successfulAdaptations: getRandomNumber(0, 800),
          },
        },
        isActive: true,
        isGlobal: true,
        applicableContexts: {
          categories: getRandomElements(categories, getRandomNumber(1, 4)),
          difficulties: getRandomElements(difficulties, getRandomNumber(1, 3)),
          learningStyles: getRandomElements(
            learningStyles,
            getRandomNumber(1, 3),
          ),
        },
        createdBy: 'system',
        version: '1.0.0',
      });
    }

    await AdaptationRule.insertMany(rulesData);
    console.log(`✅ Created ${rulesData.length} adaptation rules`);
  }

  async seedLearningPaths() {
    console.log('📚 Seeding learning paths...');
    const pathsData = [];

    const pathTemplates = [
      {
        title: 'Leadership Excellence',
        category: 'Communication & Leadership',
        difficulty: 'intermediate',
        estimatedHours: 20,
        skills: [
          'Leadership',
          'Team Management',
          'Communication',
          'Decision Making',
        ],
      },
      {
        title: 'Data Science Fundamentals',
        category: 'Data & Analytics',
        difficulty: 'beginner',
        estimatedHours: 40,
        skills: [
          'Python',
          'Statistics',
          'Machine Learning',
          'Data Visualization',
        ],
      },
      {
        title: 'Digital Marketing Mastery',
        category: 'Business Strategy',
        difficulty: 'intermediate',
        estimatedHours: 30,
        skills: ['SEO', 'Content Marketing', 'Social Media', 'Analytics'],
      },
      {
        title: 'Full Stack Development',
        category: 'Technical Skills',
        difficulty: 'advanced',
        estimatedHours: 60,
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'REST APIs'],
      },
      {
        title: 'Innovation & Design Thinking',
        category: 'Innovation & Creativity',
        difficulty: 'intermediate',
        estimatedHours: 25,
        skills: [
          'Design Thinking',
          'Problem Solving',
          'Creativity',
          'Prototyping',
        ],
      },
    ];

    for (const template of pathTemplates) {
      const instructor = this.users.find((u) => u.role === 'instructor');

      pathsData.push({
        title: template.title,
        description: `Master the essential skills of ${template.title.toLowerCase()} with our comprehensive learning path.`,
        shortDescription: `Learn ${template.title} from industry experts`,
        category: template.category,
        difficulty: template.difficulty,
        estimatedHours: template.estimatedHours,
        skills: template.skills,
        tags: [
          ...template.skills.map((s) => s.toLowerCase()),
          template.category.toLowerCase(),
        ],
        prerequisites:
          template.difficulty === 'advanced'
            ? [
              {
                pathId: null, // Would normally reference another path
                title: 'Basic programming knowledge',
                required: true,
              },
            ]
            : [],
        learningObjectives: template.skills.map((skill) => ({
          title: `Master ${skill}`,
          description: `Develop comprehensive understanding and practical skills in ${skill}`,
          estimatedTime: Math.round(
            template.estimatedHours / template.skills.length,
          ),
        })),
        instructor: {
          name: `${instructor.firstName} ${instructor.lastName}`,
          bio: 'Expert instructor with years of industry experience',
          avatar: instructor.profileImage,
          rating: getRandomFloat(4.2, 5),
          expertise: template.skills.slice(0, 3),
          yearsExperience: getRandomNumber(5, 15),
        },
        structure: {
          totalModules: getRandomNumber(8, 15),
          totalAssessments: getRandomNumber(3, 6),
          totalProjects: getRandomNumber(1, 3),
          hasCapstoneProject: template.difficulty === 'advanced',
          hasCertification: true,
        },
        metadata: {
          rating: getRandomFloat(4, 5),
          ratingCount: getRandomNumber(50, 500),
          studentsEnrolled: getRandomNumber(100, 5000),
          studentsCompleted: getRandomNumber(20, 1000),
          completionRate: getRandomFloat(60, 85),
          featured: Math.random() > 0.6,
          trending: Math.random() > 0.7,
          isNew: Math.random() > 0.8,
          languages: ['en'],
          tags: template.skills.map((s) => s.toLowerCase()),
        },
        pricing: {
          type: getRandomElement(['free', 'premium', 'enterprise']),
          price: getRandomElement([0, 49, 99, 199]),
          currency: 'USD',
        },
        status: 'published',
        isPublished: true,
        isActive: true,
        publishedAt: new Date(),
        version: '1.0.0',
      });
    }

    this.learningPaths = await LearningPath.insertMany(pathsData);
    console.log(`✅ Created ${this.learningPaths.length} learning paths`);
  }

  async seedLearningModules() {
    console.log('📖 Seeding learning modules...');
    const modulesData = [];

    for (const path of this.learningPaths) {
      const moduleCount = getRandomNumber(8, 12);

      for (let i = 0; i < moduleCount; i++) {
        const moduleTitle = `${path.title} - Module ${i + 1}`;
        const isLocked = i > 2 && Math.random() > 0.7;

        modulesData.push({
          title: moduleTitle,
          description: `Deep dive into ${moduleTitle.toLowerCase()} concepts and practical applications`,
          shortDescription: `Module ${i + 1} of ${path.title}`,
          pathId: path._id, // Using pathId as required by the model
          category: path.category,
          order: i + 1,
          difficulty: path.difficulty,
          skills: path.skills || [], // ✅ Add skills from the parent path
          content: {
            type: getRandomElement([
              'video',
              'interactive',
              'practice',
              'reading',
              'mixed',
            ]),
            duration: getRandomNumber(30, 90), // in minutes
            materials: this.generateMaterials(),
          },
          learningObjectives: [
            {
              objective: `Understand key concepts of module ${i + 1}`,
              measurable: true,
              assessable: true,
            },
            {
              objective: 'Apply learned concepts in practical scenarios',
              measurable: true,
              assessable: true,
            },
            {
              objective: 'Complete hands-on exercises and projects',
              measurable: true,
              assessable: true,
            },
          ],
          prerequisites:
            i > 0
              ? [
                {
                  moduleId: null, // Would reference previous module
                  title: `Complete Module ${i}`,
                  required: true,
                },
              ]
              : [],
          hasAssessment: Math.random() > 0.3,
          assessmentWeight: getRandomFloat(0.1, 0.3),
          tags: [`module-${i + 1}`, path.category.toLowerCase()],
          isPublished: true,
          version: '1.0.0',
        });
      }
    }

    this.learningModules = await LearningModule.insertMany(modulesData);
    console.log(`✅ Created ${this.learningModules.length} learning modules`);
  }

  async seedAssessments() {
    console.log('📝 Seeding assessments...');
    const assessmentsData = [];

    for (const path of this.learningPaths) {
      // Create path final assessment
      assessmentsData.push({
        title: `${path.title} - Final Assessment`,
        description: `Comprehensive assessment for ${path.title}`,
        type: 'path_final',
        category: path.category,
        difficulty: path.difficulty,
        questionCount: getRandomNumber(20, 40),
        estimatedDuration: getRandomNumber(45, 90),
        passingScore: 70,
        questions: this.generateAssessmentQuestions(getRandomNumber(20, 40)),
        timeConstraints: {
          hasTimeLimit: true,
          totalTimeMinutes: getRandomNumber(60, 120),
          questionTimeMinutes: 5,
          showTimer: true,
        },
        attemptSettings: {
          maxAttempts: 3,
          allowReview: true,
          shuffleQuestions: true,
          showResults: 'after_completion',
        },
        aiFeatures: {
          adaptiveQuestioning: true,
          intelligentScoring: true,
          personalizedFeedback: true,
          contextualHints: false,
        },
        scoring: {
          totalPoints: getRandomNumber(100, 200),
          passingScore: 70,
          perfectScore: 100,
          weightingMethod: 'equal',
          partialCredit: true,
        },
        relatedPaths: [path._id],
        relatedModules: this.learningModules
          .filter((m) => m.pathId.equals(path._id))
          .map((m) => m._id),
        prerequisites: {
          completedPaths: [],
          completedModules: [],
          minimumLevel: 1,
          requiredSkills: [],
        },
        certification: {
          issuesCertificate: true,
          requiredScore: 80,
        },
        createdBy: this.users.find((u) => u.role === 'instructor')._id,
        tags: path.skills || [],
        isActive: true,
        isPublished: true,
        version: '1.0.0',
      });

      // Create module assessments
      const pathModules = this.learningModules.filter((m) =>
        m.pathId.equals(path._id),
      );
      for (let i = 0; i < Math.min(3, pathModules.length); i++) {
        const module = pathModules[i * Math.floor(pathModules.length / 3)];

        assessmentsData.push({
          title: `${module.title} - Quiz`,
          description: `Knowledge check for ${module.title}`,
          type: 'module_completion',
          category: module.category || path.category, // Fallback to path category if module doesn't have one
          difficulty: module.difficulty || path.difficulty,
          questionCount: getRandomNumber(10, 20),
          estimatedDuration: getRandomNumber(15, 30),
          passingScore: 60,
          questions: this.generateAssessmentQuestions(getRandomNumber(10, 20)),
          timeConstraints: {
            hasTimeLimit: true,
            totalTimeMinutes: getRandomNumber(20, 40),
            questionTimeMinutes: 3,
            showTimer: true,
          },
          attemptSettings: {
            maxAttempts: 5,
            allowReview: false,
            shuffleQuestions: true,
            showResults: 'immediately',
          },
          aiFeatures: {
            adaptiveQuestioning: false,
            intelligentScoring: true,
            personalizedFeedback: true,
            contextualHints: true,
          },
          scoring: {
            totalPoints: getRandomNumber(50, 100),
            passingScore: 60,
            perfectScore: 100,
            weightingMethod: 'equal',
            partialCredit: true,
          },
          relatedPaths: [path._id],
          relatedModules: [module._id],
          prerequisites: {
            completedPaths: [],
            completedModules: [],
            minimumLevel: 1,
            requiredSkills: [],
          },
          certification: {
            issuesCertificate: false,
            requiredScore: 60,
          },
          createdBy: this.users.find((u) => u.role === 'instructor')._id,
          tags: [],
          isActive: true,
          isPublished: true,
          version: '1.0.0',
        });
      }
    }

    this.assessments = await Assessment.insertMany(assessmentsData);
    console.log(`✅ Created ${this.assessments.length} assessments`);
  }

  async seedUserProgress() {
    console.log('📈 Seeding user progress...');
    const progressData = [];

    // Get first 30 regular users
    const activeUsers = this.users
      .filter((u) => u.role === 'user')
      .slice(0, 30);

    for (const user of activeUsers) {
      const enrolledPaths = getRandomElements(
        this.learningPaths,
        getRandomNumber(1, 3),
      );

      for (const path of enrolledPaths) {
        const pathModules = this.learningModules.filter((m) =>
          m.pathId.equals(path._id),
        );
        const completedModuleCount = getRandomNumber(0, pathModules.length);

        progressData.push({
          userId: user._id,
          pathId: path._id,
          enrollmentDate: getRandomDate(this.startDate, this.endDate),
          lastActivityDate: getRandomDate(
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            new Date(),
          ),
          progress: {
            percentage: Math.round(
              (completedModuleCount / pathModules.length) * 100,
            ),
            completed: completedModuleCount === pathModules.length,
            timeSpent: completedModuleCount * getRandomNumber(30, 90),
            engagementScore: getRandomNumber(50, 95),
            lastAccessed: getRandomDate(
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              new Date(),
            ),
            firstAccessed: getRandomDate(this.startDate, this.endDate),
            completedAt:
              completedModuleCount === pathModules.length
                ? getRandomDate(this.startDate, this.endDate)
                : null,
            currentStreak: getRandomNumber(0, 30),
            longestStreak: getRandomNumber(0, 50),
          },
          performance: {
            averageScore: getRandomNumber(60, 95),
            bestScore: getRandomNumber(70, 100),
            assessmentScores: Array.from(
              { length: getRandomNumber(1, 5) },
              (_, i) => ({
                attemptNumber: i + 1,
                score: getRandomNumber(50, 100),
                timestamp: getRandomDate(this.startDate, this.endDate),
                timeSpent: getRandomNumber(15, 60),
              }),
            ),
            totalAssessmentAttempts: getRandomNumber(1, 10),
            strengths: getRandomElements(
              path.skills,
              getRandomNumber(1, 2),
            ).map((skill) => ({
              skill,
              confidenceLevel: getRandomNumber(70, 100),
            })),
            weaknesses: getRandomElements(
              path.skills,
              getRandomNumber(0, 1),
            ).map((skill) => ({
              skill,
              improvementNeeded: getRandomNumber(20, 70),
              recommendedActions: ['Practice more', 'Review concepts'],
            })),
            skillDevelopment: path.skills.slice(0, 2).map((skill) => ({
              skill,
              initialLevel: getRandomNumber(1, 3),
              currentLevel: getRandomNumber(3, 7),
              targetLevel: getRandomNumber(7, 10),
              progressRate: getRandomFloat(0.1, 1.0),
            })),
          },
          aiInsights: {
            personalizedContent: [],
            recommendedNextSteps: [
              {
                type: getRandomElement([
                  'continue',
                  'review',
                  'practice',
                  'advance',
                ]),
                priority: getRandomElement(['low', 'medium', 'high']),
                description: 'Continue with next module',
                estimatedTime: getRandomNumber(30, 120),
                confidence: getRandomNumber(70, 95),
              },
            ],
            adaptiveRecommendations: [],
          },
          analytics: {
            totalTimeSpent: completedModuleCount * getRandomNumber(30, 90),
            sessionsCount: getRandomNumber(
              completedModuleCount * 2,
              completedModuleCount * 5,
            ),
            averageSessionDuration: getRandomNumber(15, 60),
            activeTimeSpent: completedModuleCount * getRandomNumber(25, 80),
            engagementScore: getRandomNumber(50, 95),
            materialsViewed: getRandomNumber(
              completedModuleCount * 3,
              completedModuleCount * 8,
            ),
            weeklyGoalProgress: {
              currentWeek: {
                achieved: getRandomNumber(0, 300),
                target: getRandomNumber(180, 600),
                percentage: getRandomNumber(20, 120),
              },
              previousWeek: {
                achieved: getRandomNumber(0, 300),
                target: getRandomNumber(180, 600),
                percentage: getRandomNumber(20, 120),
              },
            },
            peakLearningHours: [
              getRandomNumber(9, 11),
              getRandomNumber(14, 16),
              getRandomNumber(19, 21),
            ],
          },
          milestones:
            completedModuleCount > 0
              ? [
                {
                  type: 'started',
                  achievedAt: getRandomDate(this.startDate, this.endDate),
                  value: 1,
                  celebrated: Math.random() > 0.5,
                },
              ]
              : [],
          goals: {
            targetCompletionDate: new Date(
              Date.now() + getRandomNumber(30, 180) * 24 * 60 * 60 * 1000,
            ),
            dailyTimeGoal: getRandomNumber(15, 90),
            weeklyTimeGoal: getRandomNumber(180, 600),
            skillLevelTarget: getRandomElement([
              'intermediate',
              'advanced',
              'expert',
            ]),
            customGoals: [],
          },
          feedback: {
            contentRating: Math.random() > 0.3 ? getRandomNumber(3, 5) : null,
            difficultyRating:
              Math.random() > 0.5
                ? getRandomElement(['too_easy', 'just_right', 'too_hard'])
                : null,
            paceRating:
              Math.random() > 0.5
                ? getRandomElement(['too_slow', 'just_right', 'too_fast'])
                : null,
            engagementRating:
              Math.random() > 0.3 ? getRandomNumber(3, 5) : null,
            comments: Math.random() > 0.7 ? 'Great learning experience!' : null,
            improvementSuggestions: [],
            wouldRecommend: Math.random() > 0.3 ? Math.random() > 0.2 : null,
          },
          status:
            completedModuleCount === pathModules.length
              ? 'completed'
              : completedModuleCount > 0
                ? 'in_progress'
                : 'not_started',
          adaptiveSettings: {
            difficultyAdjustment: true,
            contentPersonalization: true,
            pacingAdjustment: true,
            aiRecommendations: true,
          },
        });
      }
    }

    await UserProgress.insertMany(progressData);
    console.log(`✅ Created ${progressData.length} user progress records`);
  }

  async seedLearningSessions() {
    console.log('🎓 Seeding learning sessions...');
    const sessionsData = [];

    const activeUsers = this.users
      .filter((u) => u.role === 'user')
      .slice(0, 25);

    for (const user of activeUsers) {
      const sessionCount = getRandomNumber(5, 20);

      for (let i = 0; i < sessionCount; i++) {
        const path = getRandomElement(this.learningPaths);
        const module = getRandomElement(
          this.learningModules.filter((m) => m.pathId.equals(path._id)),
        );
        const startTime = getRandomDate(this.startDate, this.endDate);
        const duration = getRandomNumber(15, 90);
        const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

        sessionsData.push({
          sessionId: uuidv4(),
          userId: user._id,
          pathId: path._id,
          moduleId: module._id,
          startTime,
          endTime,
          totalDuration: duration,
          activeDuration: Math.round(duration * getRandomFloat(0.6, 0.95)),
          pauseDuration: Math.round(duration * getRandomFloat(0, 0.2)),
          status: 'completed',
          completionReason: 'natural_end',
          learningObjectives: module.learningObjectives.map((obj) => ({
            objective: obj.objective,
            achieved: Math.random() > 0.3,
            confidenceLevel: getRandomNumber(50, 100),
          })),
          contentInteractions: this.generateContentInteractions(),
          performance: {
            engagementScore: getRandomNumber(60, 95),
            focusScore: getRandomNumber(50, 90),
            comprehensionScore: getRandomNumber(55, 95),
            progressMade: getRandomNumber(10, 100),
            strugglingIndicators:
              Math.random() > 0.7
                ? [
                  {
                    indicator: getRandomElement([
                      'repeated_content',
                      'long_pauses',
                      'help_requests',
                    ]),
                    severity: getRandomElement(['low', 'medium', 'high']),
                    frequency: getRandomNumber(1, 5),
                  },
                ]
                : [],
          },
          activities: this.generateSessionActivities(duration),
          deviceInfo: {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            platform: getRandomElement([
              'macOS',
              'Windows',
              'Linux',
              'iOS',
              'Android',
            ]),
            browser: getRandomElement(['Chrome', 'Firefox', 'Safari', 'Edge']),
            screenResolution: getRandomElement([
              '1920x1080',
              '1366x768',
              '1440x900',
              '375x667',
            ]),
            timezone: 'UTC',
            language: 'en-US',
            deviceType: getRandomElement(['desktop', 'mobile', 'tablet']),
          },
          environment: {
            location: getRandomElement([
              'home',
              'office',
              'library',
              'cafe',
              'other',
            ]),
            noiseLevel: getRandomElement(['quiet', 'moderate', 'noisy']),
            distractions: [],
          },
          notes:
            Math.random() > 0.7
              ? [
                {
                  content: 'Important concept to remember',
                  timestamp: new Date(
                    Date.now() - getRandomNumber(0, duration * 60 * 1000),
                  ),
                  materialId: new mongoose.Types.ObjectId(),
                  materialPosition: getRandomNumber(0, 100),
                  isPrivate: true,
                  tags: ['important', 'review'],
                },
              ]
              : [],
          helpRequests:
            Math.random() > 0.8
              ? [
                {
                  question: 'Can you explain this concept in more detail?',
                  context: 'Having trouble understanding the main idea',
                  timestamp: new Date(
                    Date.now() - getRandomNumber(0, duration * 60 * 1000),
                  ),
                  aiResponse: 'Let me break this down for you...',
                  userSatisfaction: getRandomNumber(3, 5),
                  resolved: true,
                },
              ]
              : [],
          feedback: {
            overallSatisfaction:
              Math.random() > 0.6 ? getRandomNumber(3, 5) : null,
            contentQuality: Math.random() > 0.6 ? getRandomNumber(3, 5) : null,
            difficultyRating:
              Math.random() > 0.5
                ? getRandomElement(['too_easy', 'just_right', 'too_hard'])
                : null,
            paceRating:
              Math.random() > 0.5
                ? getRandomElement(['too_slow', 'just_right', 'too_fast'])
                : null,
            technicalIssues: [],
            suggestions: Math.random() > 0.8 ? 'Great session overall!' : null,
            wouldRecommend: Math.random() > 0.3 ? Math.random() > 0.2 : null,
          },
          achievements:
            Math.random() > 0.9
              ? [
                {
                  type: getRandomElement([
                    'first_session',
                    'streak_milestone',
                    'focus_achievement',
                  ]),
                  description: 'Achievement unlocked!',
                  earnedAt: new Date(),
                  points: getRandomNumber(10, 100),
                },
              ]
              : [],
          metadata: {
            version: '1.0',
            source: 'web',
            experimentGroups: [],
            flags: [],
          },
        });
      }
    }

    await LearningSession.insertMany(sessionsData);
    console.log(`✅ Created ${sessionsData.length} learning sessions`);
  }

  async seedAISessions() {
    console.log('🤖 Seeding AI sessions...');
    const aiSessionsData = [];

    const activeUsers = this.users
      .filter((u) => u.role === 'user')
      .slice(0, 20);

    for (const user of activeUsers) {
      const sessionCount = getRandomNumber(3, 10);

      for (let i = 0; i < sessionCount; i++) {
        const module = getRandomElement(this.learningModules);
        const prompt = getRandomElement(this.aiPrompts);
        const startTime = getRandomDate(this.startDate, this.endDate);

        aiSessionsData.push({
          sessionId: uuidv4(),
          userId: user._id,
          aiPersonality: user.learningProfile.aiPersonality, // ✅ Fixed: was 'personality'
          startTime,
          endTime: new Date(
            startTime.getTime() + getRandomNumber(5, 30) * 60 * 1000,
          ),
          lastInteraction: new Date(),
          status: 'completed',
          messages: this.generateAIMessages(getRandomNumber(4, 12)),
          context: {
            currentModule: module._id,
            currentPath: module.pathId,
            learningSession: null,
            sessionDuration: getRandomNumber(5, 30),
            userState: getRandomElement([
              'focused',
              'struggling',
              'motivated',
              'fatigued',
              'confused',
              'engaged',
            ]),
            lastActivity: new Date(),
            progressContext: {
              currentProgress: getRandomNumber(0, 100),
              recentPerformance: getRandomNumber(50, 95),
              strugglingAreas:
                Math.random() > 0.6 && module.skills && module.skills.length > 0
                  ? getRandomElements(module.skills, 1)
                  : [],
              strengths:
                module.skills && module.skills.length > 0
                  ? getRandomElements(module.skills, getRandomNumber(1, 2))
                  : ['General Understanding'],
              lastAssessmentScore:
                Math.random() > 0.5 ? getRandomNumber(60, 95) : null,
            },
            deviceType: getRandomElement([
              'desktop',
              'tablet',
              'mobile',
              'unknown',
            ]),
            platform: getRandomElement(['Windows', 'macOS', 'iOS', 'Android']),
            timezone: 'UTC',
          },
          analytics: {
            totalMessages: getRandomNumber(4, 12),
            userMessages: getRandomNumber(2, 6),
            assistantMessages: getRandomNumber(2, 6),
            averageResponseTime: getRandomNumber(500, 2000),
            averageConfidence: getRandomNumber(70, 95),
            averageRating: getRandomFloat(3.5, 5),
            engagementScore: getRandomNumber(60, 95),
            helpfulnessScore: getRandomNumber(65, 98),
            topicsDiscussed:
              module.skills && module.skills.length > 0
                ? getRandomElements(module.skills, getRandomNumber(1, 3))
                : ['Learning', 'Understanding', 'Practice'],
            mostCommonIntent: getRandomElement([
              'help',
              'clarification',
              'motivation',
              'assessment',
              'general',
              'feedback',
            ]),
            adaptationsApplied: [], // ✅ Keep it simple for now
          },
          configuration: {
            modelType: 'openai-gpt4',
            maxMessages: 100,
            sessionTimeout: 30,
            adaptiveMode: true,
            contextAware: true,
          },
          outcomes: {
            problemsSolved: getRandomNumber(0, 5),
            conceptsClarified:
              module.skills && module.skills.length > 0
                ? getRandomElements(module.skills, getRandomNumber(0, 2))
                : [],
            recommendationsGiven: [
              'Continue practicing',
              'Review previous concepts',
              'Try advanced exercises',
            ].slice(0, getRandomNumber(0, 3)),
            userSatisfaction:
              Math.random() > 0.3 ? getRandomNumber(3, 5) : null,
            sessionNotes:
              Math.random() > 0.8 ? 'Productive learning session' : null,
          },
        });
      }
    }

    await AISession.insertMany(aiSessionsData);
    console.log(`✅ Created ${aiSessionsData.length} AI sessions`);
  }

  async seedAssessmentSessions() {
    console.log('📊 Seeding assessment sessions...');
    const assessmentSessionsData = [];

    const activeUsers = this.users
      .filter((u) => u.role === 'user')
      .slice(0, 20);

    for (const user of activeUsers) {
      const userAssessments = getRandomElements(
        this.assessments,
        getRandomNumber(1, 5),
      );

      for (const assessment of userAssessments) {
        const startTime = getRandomDate(this.startDate, this.endDate);
        const timeSpent =
          getRandomNumber(
            assessment.estimatedDuration * 0.5,
            assessment.estimatedDuration * 1.5,
          ) * 60;
        const endTime = new Date(startTime.getTime() + timeSpent * 1000);

        const answers = this.generateAssessmentAnswers(assessment);
        const { totalScore, maxScore, percentageScore } =
          this.calculateAssessmentScore(answers);

        assessmentSessionsData.push({
          sessionId: uuidv4(),
          userId: user._id,
          assessmentId: assessment._id,
          attemptNumber: getRandomNumber(1, 3),
          startTime,
          endTime,
          lastActivity: endTime,
          status: 'completed',
          answers,
          sessionConfig: {
            hasTimeLimit: assessment.timeConstraints.hasTimeLimit,
            totalTimeMinutes: assessment.timeConstraints.totalTimeMinutes,
            questionTimeMinutes: assessment.timeConstraints.questionTimeMinutes,
            allowReview: assessment.attemptSettings.allowReview,
            showResults: assessment.attemptSettings.showResults,
            adaptiveQuestioning: assessment.aiFeatures.adaptiveQuestioning,
          },
          progress: {
            currentQuestionIndex: assessment.questionCount,
            questionsAnswered: assessment.questionCount,
            totalQuestions: assessment.questionCount,
            completionPercentage: 100,
          },
          timeTracking: {
            totalTimeSpent: timeSpent,
            questionTimes: answers.map((_, idx) => ({
              questionId: answers[idx].questionId,
              timeSpent: getRandomNumber(30, 180),
            })),
          },
          results: {
            finalScore: percentageScore,
            totalPointsEarned: totalScore,
            totalPointsPossible: maxScore,
            passingScore: assessment.scoring.passingScore, // ✅ Fixed: was assessment.passingScore
            passed: percentageScore >= assessment.scoring.passingScore, // ✅ Fixed: was assessment.passingScore
            grade: this.calculateGrade(percentageScore),
            totalTimeSpent: timeSpent, // ✅ Added required field
            averageTimePerQuestion: Math.round(
              timeSpent / assessment.questionCount,
            ),
            scoreByDifficulty: {
              beginner: getRandomNumber(70, 100),
              intermediate: getRandomNumber(60, 90),
              advanced: getRandomNumber(40, 80),
              expert: getRandomNumber(30, 70),
            },
            scoreBySkill:
              assessment.skills?.slice(0, 3).map((skill) => ({
                skill,
                score: getRandomNumber(50, 100),
                maxScore: 100,
                percentage: getRandomNumber(50, 100),
              })) || [],
            // ✅ Removed scoreByQuestionType for now to avoid casting issues
            strengths: getRandomElements(
              assessment.skills || ['Problem Solving'],
              getRandomNumber(1, 2),
            ),
            weaknesses: getRandomElements(
              assessment.skills || ['Time Management'],
              getRandomNumber(0, 2),
            ),
            recommendations: [
              'Review the incorrect answers',
              'Practice more similar questions',
              'Focus on time management',
            ].slice(0, getRandomNumber(1, 3)),
            aiInsights: {
              overallAssessment: 'Good performance with room for improvement',
              learningGaps: getRandomElements(
                assessment.skills || ['Concepts'],
                getRandomNumber(0, 2),
              ),
              nextSteps: ['Continue to next module', 'Review weak areas'],
              studyRecommendations: ['Practice daily', 'Join study groups'],
              estimatedImprovementTime: getRandomNumber(5, 20),
              confidenceLevel: getRandomNumber(70, 95),
            },
          },
          userContext: {
            deviceType: getRandomElement(['desktop', 'mobile', 'tablet']),
            browser: getRandomElement(['Chrome', 'Firefox', 'Safari']),
            timezone: user.timezone || 'UTC',
            learningStyle: user.learningProfile.learningStyle,
            currentLevel: assessment.difficulty,
          },
        });
      }
    }

    await AssessmentSession.insertMany(assessmentSessionsData);
    console.log(
      `✅ Created ${assessmentSessionsData.length} assessment sessions`,
    );
  }

  async seedCertificates() {
    console.log('🏆 Seeding certificates...');
    const certificatesData = [];

    const completedAssessments = await AssessmentSession.find({
      status: 'completed',
      'results.passed': true,
      'results.percentageScore': { $gte: 80 },
    }).limit(30);

    for (const session of completedAssessments) {
      const assessment = this.assessments.find((a) =>
        a._id.equals(session.assessmentId),
      );
      const user = this.users.find((u) => u._id.equals(session.userId));
      const path = this.learningPaths.find((p) =>
        p._id.equals(assessment.relatedPaths[0]),
      );

      if (!assessment || !user || !path) continue;

      const issueDate = new Date(session.endTime);
      const certificateId = `CERT-${Date.now()}-${getRandomNumber(1000, 9999)}`;

      certificatesData.push({
        certificateId,
        userId: user._id,
        pathId: path._id,
        assessmentId: assessment._id,
        type: assessment.type === 'path_final' ? 'completion' : 'achievement',
        title: `Certificate of ${
          assessment.type === 'path_final' ? 'Completion' : 'Achievement'
        }`,
        recipientName: `${user.firstName} ${user.lastName}`,
        courseName: path.title,
        category: path.category,
        level: path.difficulty,
        issueDate,
        validFrom: issueDate,
        validUntil:
          assessment.type === 'path_final'
            ? new Date(issueDate.getTime() + 2 * 365 * 24 * 60 * 60 * 1000)
            : null,
        skills: {
          verified: path.skills,
          assessmentScores: [
            {
              skill: path.skills[0],
              score: session.results.percentageScore,
              level: this.getSkillLevel(session.results.percentageScore),
            },
          ],
        },
        achievementDetails: {
          finalScore: session.results.percentageScore,
          completionTime: path.estimatedDuration,
          totalModulesCompleted: path.structure?.totalModules || 10,
          projectsCompleted: getRandomNumber(1, 3),
          rank: getRandomElement(['Top 10%', 'Top 20%', 'Top 30%']),
          distinction:
            session.results.percentageScore >= 90 ? 'With Distinction' : null,
        },
        issuer: {
          name: 'Sokol Learning Platform',
          title: 'Director of Education',
          signature: 'Dr. Sarah Mitchell',
          organizationLogo: 'https://sokol-learning.com/logo.png',
        },
        verification: {
          verificationCode: this.generateVerificationCode(),
          verificationUrl: `https://sokol-learning.com/verify/${certificateId}`,
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?data=${certificateId}`,
          isVerified: true,
          verifiedAt: issueDate,
        },
        blockchain: {
          isBlockchainEnabled: Math.random() > 0.7,
          network: 'polygon',
          transactionHash:
            Math.random() > 0.7 ? this.generateBlockchainHash() : null,
          blockNumber:
            Math.random() > 0.7 ? getRandomNumber(1000000, 9999999) : null,
        },
        design: {
          template: 'modern',
          primaryColor: '#4F46E5',
          accentColor: '#10B981',
          fontFamily: 'Inter',
          logoPosition: 'top-center',
          borderStyle: 'elegant',
          backgroundPattern: 'geometric',
        },
        sharing: {
          isPublic: true,
          shareableUrl: `https://sokol-learning.com/certificates/${certificateId}`,
          linkedInShareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=https://sokol-learning.com/certificates/${certificateId}`,
          downloadCount: getRandomNumber(0, 10),
          viewCount: getRandomNumber(0, 100),
        },
        status: 'issued',
        metadata: {
          credentialType: 'Digital Certificate',
          industryRecognition: ['IEEE', 'ACM'],
          competencyFramework: 'Industry Standard',
          version: '1.0.0',
        },
      });
    }

    await Certificate.insertMany(certificatesData);
    console.log(`✅ Created ${certificatesData.length} certificates`);
  }

  async seedLearningAnalytics() {
    console.log('📊 Seeding learning analytics...');
    const analyticsData = [];

    const activeUsers = this.users
      .filter((u) => u.role === 'user')
      .slice(0, 25);

    for (const user of activeUsers) {
      const periods = ['daily', 'weekly', 'monthly'];

      for (const periodType of periods) {
        const startDate = this.getPeriodStartDate(periodType);
        const endDate = new Date();

        analyticsData.push({
          user: user._id,
          period: {
            type: periodType,
            startDate,
            endDate,
            duration: Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)),
          },
          engagement: {
            totalSessionTime: getRandomNumber(60, 600),
            averageSessionDuration: getRandomNumber(20, 60),
            sessionCount: getRandomNumber(5, 30),
            interactionRate: getRandomFloat(0.5, 5),
            focusScore: getRandomNumber(50, 95),
            consistencyScore: getRandomNumber(40, 90),
            peakHours: [
              getRandomNumber(9, 11),
              getRandomNumber(14, 16),
              getRandomNumber(19, 21),
            ],
          },
          progress: {
            modulesStarted: getRandomNumber(1, 10),
            modulesCompleted: getRandomNumber(0, 8),
            pathsEnrolled: getRandomNumber(1, 3),
            pathsCompleted: getRandomNumber(0, 1),
            completionRate: getRandomNumber(30, 95),
            averageModuleScore: getRandomNumber(60, 95),
            velocityTrend: getRandomElement([
              'increasing',
              'stable',
              'decreasing',
            ]),
            estimatedCompletionDate: new Date(
              Date.now() + getRandomNumber(30, 180) * 24 * 60 * 60 * 1000,
            ),
          },
          performance: {
            optimalLearningTime: {
              hour: getRandomNumber(9, 20),
              dayOfWeek: getRandomNumber(0, 6),
              confidence: getRandomNumber(60, 95),
            },
            strugglePatterns:
              Math.random() > 0.6
                ? [
                  {
                    type: getRandomElement([
                      'concept_difficulty',
                      'time_management',
                      'retention',
                    ]),
                    frequency: getRandomFloat(0.1, 0.5),
                    severity: getRandomElement(['low', 'medium', 'high']),
                    affectedSkills: getRandomElements(
                      ['Programming', 'Math', 'Writing'],
                      1,
                    ),
                    category: getRandomElement(categories),
                    difficulty: getRandomElement(difficulties),
                    strugglingTopics: getRandomElements(
                      ['Variables', 'Functions', 'Loops'],
                      getRandomNumber(1, 2),
                    ),
                    interventionNeeded: Math.random() > 0.7,
                  },
                ]
                : [],
            strengthAreas: getRandomElements(
              categories,
              getRandomNumber(1, 3),
            ).map((category) => ({
              category,
              proficiencyLevel: getRandomNumber(70, 95),
              consistencyScore: getRandomNumber(60, 90),
            })), // ✅ Fixed: Now objects instead of strings
            improvementAreas: getRandomElements(
              categories,
              getRandomNumber(0, 2),
            ).map((category) => ({
              category,
              proficiencyLevel: getRandomNumber(30, 60),
              consistencyScore: getRandomNumber(20, 50),
            })), // ✅ Fixed: Now objects instead of strings
            learningEfficiency: getRandomNumber(60, 95),
            retentionRate: getRandomNumber(70, 98),
          },
          aiInteraction: {
            totalInteractions: getRandomNumber(10, 100),
            averageResponseTime: getRandomNumber(500, 2000), // ✅ Fixed: Changed from averageSessionLength
            satisfactionScore: getRandomFloat(3.5, 5),
            personalityUsage: {
              ARIA: getRandomFloat(0, 100),
              SAGE: getRandomFloat(0, 100),
              COACH: getRandomFloat(0, 100),
            },
            effectivenessScore: getRandomNumber(60, 95),
          }, // ✅ Removed non-schema fields
          recommendations: {
            generated: getRandomNumber(2, 10),
            accepted: getRandomNumber(0, 8),
            effectiveness: getRandomNumber(50, 90),
            lastRecommendation: getRandomDate(startDate, endDate),
            topRecommendations: [
              'Focus on morning study sessions',
              'Take more frequent breaks',
              'Review previous modules',
            ].slice(0, getRandomNumber(1, 3)),
          },
          calculatedAt: endDate,
          version: '1.0',
        });
      }
    }

    await LearningAnalytics.insertMany(analyticsData);
    console.log(
      `✅ Created ${analyticsData.length} learning analytics records`,
    );
  }
  async seedRecommendations() {
    console.log('🎯 Seeding recommendations...');
    const recommendationsData = [];

    const activeUsers = this.users
      .filter((u) => u.role === 'user')
      .slice(0, 20);

    for (const user of activeUsers) {
      const recommendationCount = getRandomNumber(3, 8);

      for (let i = 0; i < recommendationCount; i++) {
        const type = getRandomElement([
          'next_module',
          'learning_path',
          'review_content',
          'skill_development',
          'schedule_optimization',
          'ai_personality',
        ]);

        recommendationsData.push({
          user: user._id,
          type,
          category: getRandomElement(categories),
          title: this.generateRecommendationTitle(type),
          description: this.generateRecommendationDescription(type),
          actionable: {
            primaryAction: this.getPrimaryAction(type),
            secondaryActions: this.getSecondaryActions(type),
            deepLink: `/recommendations/${type}/${getRandomNumber(1, 100)}`,
          },
          relevanceScore: getRandomNumber(70, 100),
          confidenceScore: getRandomNumber(60, 95),
          priorityScore: getRandomNumber(60, 95),
          reasoning: {
            basedOn: getRandomElements(
              ['performance', 'engagement', 'preferences', 'goals'],
              2,
            ),
            factors: [
              'Recent assessment scores',
              'Learning pace analysis',
              'Peer comparison',
            ].slice(0, getRandomNumber(1, 3)),
            explanation: `Based on your ${getRandomElement([
              'recent performance',
              'learning patterns',
              'goals',
            ])}`,
          },
          relatedContent: {
            paths: getRandomElements(
              this.learningPaths,
              getRandomNumber(0, 2),
            ).map((p) => p._id),
            modules: getRandomElements(
              this.learningModules,
              getRandomNumber(0, 3),
            ).map((m) => m._id),
            assessments: getRandomElements(
              this.assessments,
              getRandomNumber(0, 1),
            ).map((a) => a._id),
          },
          // ✅ FIXED: Add the required generatedBy field
          generatedBy: {
            algorithm: getRandomElement([
              'collaborative_filtering',
              'content_based', 
              'hybrid',
              'ai_driven',
              'rule_based',
            ]),
            version: '1.0.0',
            factors: [
              {
                name: 'user_performance',
                weight: getRandomFloat(0.1, 0.9),
                value: getRandomFloat(0, 100),
              },
              {
                name: 'engagement_level', 
                weight: getRandomFloat(0.1, 0.9),
                value: getRandomFloat(0, 100),
              },
            ],
          },
          timing: {
            generatedAt: getRandomDate(
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              new Date(),
            ),
            validUntil: new Date(
              Date.now() + getRandomNumber(7, 30) * 24 * 60 * 60 * 1000,
            ),
            suggestedTiming: getRandomElement([
              'immediate',
              'today', 
              'this_week',
              'next_week',
              'flexible',
            ]),
            isUrgent: Math.random() > 0.8,
          },
          userInteraction:
            Math.random() > 0.3
              ? {
                status: getRandomElement([
                  'pending',
                  'viewed', 
                  'accepted',
                  'declined',
                  'dismissed',
                ]),
                viewedAt: getRandomDate(
                  new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                  new Date(),
                ),
                response: getRandomElement([
                  'accepted',
                  'declined',
                  'maybe_later',
                  'not_interested',
                ]),
                respondedAt:
                    Math.random() > 0.5
                      ? getRandomDate(
                        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                        new Date(),
                      )
                      : null,
                feedback:
                    Math.random() > 0.7
                      ? {
                        helpfulness: getRandomNumber(1, 5),
                        relevance: getRandomNumber(1, 5),
                        timing: getRandomNumber(1, 5),
                        comment: Math.random() > 0.5 ? 'Very helpful recommendation!' : null,
                      }
                      : null,
                actionTaken: Math.random() > 0.6,
                actionTakenAt: Math.random() > 0.6 ? new Date() : null,
              }
              : null,
          effectiveness: {
            improvedEngagement: Math.random() > 0.6,
            improvedPerformance: Math.random() > 0.7,
            completedSuggestedAction: Math.random() > 0.5,
            impact: {
              engagementChange: getRandomNumber(-20, 40),
              performanceChange: getRandomNumber(-10, 30),
              timeToComplete: Math.random() > 0.5 ? getRandomNumber(1, 14) : null,
            },
          },
          // ✅ FIXED: Remove metadata object and move fields to proper locations
          personalization: {
            matchesPreferences: getRandomNumber(60, 100),
            similarUserSuccess: getRandomNumber(50, 95),
            personalizedMessage: Math.random() > 0.7 ? 'This recommendation is tailored specifically for your learning style!' : null,
          },
          version: '1.0.0',
        });
      }
    }

    await RecommendationEngine.insertMany(recommendationsData);
    console.log(`✅ Created ${recommendationsData.length} recommendations`);
  }
  // Helper methods
  generatePromptTemplate(personality, contextType) {
    const templates = {
      ARIA: {
        learning_help: {
          systemPrompt:
            'You are ARIA, an enthusiastic and supportive AI learning companion. Provide helpful, encouraging guidance while maintaining a warm and friendly tone.',
          userPromptTemplate:
            'The user needs help with {{topic}}. Their current module is {{moduleTitle}} and they are at {{progressPercentage}}% progress. Provide encouraging and clear assistance.',
        },
        motivation: {
          systemPrompt:
            'You are ARIA, focused on inspiring and motivating learners. Be enthusiastic, positive, and celebrate achievements.',
          userPromptTemplate:
            'The user\'s motivation level is {{motivationLevel}}. They have completed {{completedModules}} modules. Provide motivational support.',
        },
        assessment_feedback: {
          systemPrompt:
            'You are ARIA, providing constructive and encouraging feedback on assessments.',
          userPromptTemplate:
            'The user scored {{score}}% on {{assessmentTitle}}. Provide encouraging feedback and improvement suggestions.',
        },
      },
      SAGE: {
        learning_help: {
          systemPrompt:
            'You are SAGE, an analytical and knowledgeable AI guide. Provide detailed, systematic explanations with depth and precision.',
          userPromptTemplate:
            'Analyze the topic {{topic}} for a user at {{currentLevel}} level. Provide comprehensive insights and explanations.',
        },
        motivation: {
          systemPrompt:
            'You are SAGE, offering data-driven motivation based on progress metrics and achievements.',
          userPromptTemplate:
            'Based on analytics showing {{performanceMetrics}}, provide analytical motivation and strategic guidance.',
        },
        assessment_feedback: {
          systemPrompt:
            'You are SAGE, delivering detailed assessment analysis with objective insights.',
          userPromptTemplate:
            'Analyze assessment results: {{score}}% with strengths in {{strengths}} and areas for improvement in {{weaknesses}}.',
        },
      },
      COACH: {
        learning_help: {
          systemPrompt:
            'You are COACH, a personal learning mentor. Guide users step-by-step, asking questions to help them discover solutions themselves.',
          userPromptTemplate:
            'Guide the user through {{topic}} using the Socratic method. They are currently at {{skillLevel}} level.',
        },
        motivation: {
          systemPrompt:
            'You are COACH, a personal mentor focused on accountability and goal achievement.',
          userPromptTemplate:
            'The user\'s goal is {{learningGoal}} with {{daysRemaining}} days remaining. Provide coaching and accountability.',
        },
        assessment_feedback: {
          systemPrompt:
            'You are COACH, providing personalized feedback focused on growth and improvement strategies.',
          userPromptTemplate:
            'Review the assessment performance of {{score}}% and create a personalized improvement plan.',
        },
      },
    };

    // Default template for any missing combinations
    const defaultTemplate = {
      systemPrompt: `You are ${personality}, an AI learning assistant. Provide helpful guidance appropriate for ${contextType.replace(
        /_/g,
        ' ',
      )} situations.`,
      userPromptTemplate:
        'Assist the user with their request in the context of {{moduleTitle}} at {{progressPercentage}}% progress.',
    };

    return (
      templates[personality]?.[contextType] ||
      templates[personality]?.learning_help ||
      defaultTemplate
    );
  }

  getContextVariables(contextType) {
    const variables = {
      learning_help: [
        'topic',
        'moduleTitle',
        'progressPercentage',
        'currentLevel',
      ],
      motivation: [
        'motivationLevel',
        'completedModules',
        'learningGoal',
        'performanceMetrics',
      ],
      assessment_feedback: [
        'score',
        'assessmentTitle',
        'strengths',
        'weaknesses',
      ],
      progress_review: [
        'progressPercentage',
        'timeSpent',
        'averageScore',
        'completedModules',
      ],
      module_introduction: [
        'moduleTitle',
        'learningObjectives',
        'estimatedDuration',
        'difficulty',
      ],
      concept_explanation: [
        'concept',
        'learningStyle',
        'currentLevel',
        'examples',
      ],
      skill_guidance: [
        'skillName',
        'currentProficiency',
        'targetProficiency',
        'practiceTime',
      ],
      encouragement: ['recentAchievement', 'progressMade', 'nextMilestone'],
      challenge: ['challengeLevel', 'previousBest', 'leaderboardPosition'],
      reflection: ['learningJourney', 'keyInsights', 'growthAreas'],
      goal_setting: ['currentGoals', 'timeframe', 'resources', 'obstacles'],
    };

    return (variables[contextType] || ['userQuestion', 'context']).map(
      (name) => ({
        name,
        type: 'learning_progress',
        description: `Variable for ${name}`,
        required: Math.random() > 0.3,
      }),
    );
  }

  generateAdaptationRules(contextType) {
    const rules = [];

    if (contextType === 'learning_help' || contextType === 'skill_guidance') {
      rules.push({
        triggerCondition: 'user_struggling',
        conditionValue: 60,
        modification: 'simplify_language',
        modificationText: 'Use simpler explanations and more examples',
        priority: getRandomNumber(1, 10),
      });
    }

    if (contextType === 'motivation' || contextType === 'encouragement') {
      rules.push({
        triggerCondition: 'low_engagement',
        conditionValue: 50,
        modification: 'increase_encouragement',
        modificationText:
          'Add more motivational content and celebrate small wins',
        priority: getRandomNumber(1, 10),
      });
    }

    if (contextType === 'assessment_feedback') {
      rules.push({
        triggerCondition: 'assessment_failed',
        conditionValue: 70,
        modification: 'provide_hints',
        modificationText: 'Provide additional hints and learning resources',
        priority: getRandomNumber(1, 10),
      });
    }

    return rules;
  }

  generateMaterials() {
    const materials = [];
    const materialTypes = ['video', 'text', 'interactive', 'document', 'quiz'];
    const count = getRandomNumber(3, 8);

    for (let i = 0; i < count; i++) {
      const type = getRandomElement(materialTypes);
      materials.push({
        type,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Material ${
          i + 1
        }`,
        url: `https://content.sokol-learning.com/${type}/${getRandomNumber(
          1000,
          9999,
        )}`,
        duration:
          type === 'video' ? getRandomNumber(5, 30) : getRandomNumber(3, 15),
        fileSize: getRandomNumber(1000000, 50000000), // 1MB to 50MB
        mimeType:
          type === 'video'
            ? 'video/mp4'
            : type === 'document'
              ? 'application/pdf'
              : 'text/html',
        adaptiveVariations: learningStyles.map((style) => ({
          learningStyle: style,
          content: {
            url: `https://content.sokol-learning.com/${style}/${type}/${getRandomNumber(
              1000,
              9999,
            )}`,
            description: `${style} version of the content`,
            additionalResources: [],
            interactionType: getRandomElement([
              'watch',
              'read',
              'practice',
              'explore',
            ]),
          },
        })),
        accessibility: {
          hasSubtitles: type === 'video',
          hasTranscript: type === 'video' || type === 'audio',
          hasAudioDescription: false,
        },
      });
    }

    return materials;
  }

  // ✅ FIXED: Use UUIDs for globally unique question IDs
  generateAssessmentQuestions(count) {
    const questions = [];
    const types = ['multiple_choice', 'true_false', 'short_answer'];

    for (let i = 0; i < count; i++) {
      const type = getRandomElement(types);
      questions.push({
        questionId: uuidv4(), // ✅ Use UUID for globally unique ID
        question: `Question ${i + 1}: Sample question about the topic`,
        type,
        options:
          type === 'multiple_choice'
            ? [
              { text: 'Option A', isCorrect: i % 4 === 0 },
              { text: 'Option B', isCorrect: i % 4 === 1 },
              { text: 'Option C', isCorrect: i % 4 === 2 },
              { text: 'Option D', isCorrect: i % 4 === 3 },
            ]
            : type === 'true_false'
              ? [
                { text: 'True', isCorrect: Math.random() > 0.5 },
                { text: 'False', isCorrect: Math.random() <= 0.5 },
              ]
              : [],
        correctAnswer:
          type === 'multiple_choice'
            ? getRandomNumber(0, 3)
            : type === 'true_false'
              ? Math.random() > 0.5
              : 'Sample answer',
        points: getRandomNumber(1, 10),
        explanation: 'This is why this answer is correct',
        difficulty: getRandomElement(difficulties),
        skills: [], // Empty array since it expects objects not strings
        tags: ['assessment', `question-${i + 1}`],
      });
    }

    return questions;
  }

  generateAssessmentAnswers(assessment) {
    return assessment.questions.map((question, index) => {
      const isCorrect = Math.random() > 0.3;
      return {
        questionId: question.questionId, // ✅ Use the question's actual questionId
        questionIndex: index,
        userAnswer: isCorrect
          ? question.correctAnswer
          : question.type === 'multiple_choice'
            ? getRandomNumber(0, 3)
            : question.type === 'true_false'
              ? !question.correctAnswer
              : 'User\'s answer',
        correctAnswer: question.correctAnswer,
        isCorrect,
        isSkipped: Math.random() > 0.95,
        pointsEarned: isCorrect ? question.points : 0,
        maxPoints: question.points,
        timeSpent: getRandomNumber(30, 180),
        attempts: getRandomNumber(1, 3),
        confidence: getRandomNumber(1, 5),
        flaggedForReview: Math.random() > 0.9,
      };
    });
  }

  calculateAssessmentScore(answers) {
    const totalScore = answers.reduce((sum, a) => sum + a.pointsEarned, 0);
    const maxScore = answers.reduce((sum, a) => sum + a.maxPoints, 0);
    const percentageScore = Math.round((totalScore / maxScore) * 100);

    return { totalScore, maxScore, percentageScore };
  }

  calculateGrade(percentageScore) {
    if (percentageScore >= 90) return 'A';
    if (percentageScore >= 80) return 'B';
    if (percentageScore >= 70) return 'C';
    if (percentageScore >= 60) return 'D';
    return 'F';
  }

  getSkillLevel(score) {
    if (score >= 90) return 'expert';
    if (score >= 75) return 'advanced';
    if (score >= 60) return 'intermediate';
    return 'beginner';
  }

  generateVerificationCode() {
    return `SOK-${Date.now()}-${getRandomNumber(1000, 9999)}`;
  }

  generateBlockchainHash() {
    return (
      '0x' +
      Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join('')
    );
  }

  generateSessionActivities(duration) {
    const activities = [];
    const activityTypes = [
      'session_start',
      'content_view',
      'content_skip',
      'content_replay',
      'content_bookmark',
      'assessment_start',
      'assessment_submit',
      'note_create',
      'help_request',
      'feedback_submit',
      'session_end',
    ];
    const count = getRandomNumber(5, Math.min(15, duration / 3));

    for (let i = 0; i < count; i++) {
      activities.push({
        timestamp: new Date(
          Date.now() - getRandomNumber(0, duration * 60 * 1000),
        ),
        action: getRandomElement(activityTypes),
        details: {
          contentId: `content-${getRandomNumber(1, 100)}`,
          progress: getRandomNumber(0, 100),
        },
        duration: getRandomNumber(1, 10),
      });
    }

    return activities;
  }

  generateContentInteractions() {
    const interactions = [];
    const count = getRandomNumber(3, 8);
    const materialTypes = [
      'video',
      'text',
      'image',
      'audio',
      'interactive',
      'document',
      'link',
      'quiz',
    ];

    for (let i = 0; i < count; i++) {
      interactions.push({
        materialId: new mongoose.Types.ObjectId(),
        materialType: getRandomElement(materialTypes),
        timeSpent: getRandomNumber(30, 600), // seconds
        engagementLevel: getRandomElement(['low', 'medium', 'high']),
        completionPercentage: getRandomNumber(0, 100),
        interactions: [
          {
            type: getRandomElement([
              'play',
              'pause',
              'seek',
              'scroll',
              'click',
            ]),
            timestamp: new Date(Date.now() - getRandomNumber(0, 3600000)),
            position: getRandomNumber(0, 100),
          },
        ],
        skipped: Math.random() > 0.8,
        bookmarked: Math.random() > 0.9,
        rating: Math.random() > 0.7 ? getRandomNumber(3, 5) : null,
        feedback: Math.random() > 0.8 ? 'Good content quality' : null,
      });
    }

    return interactions;
  }

  generateAIMessages(count) {
    const messages = [];
    const roles = ['user', 'assistant'];

    for (let i = 0; i < count; i++) {
      const role = roles[i % 2];
      messages.push({
        messageId: uuidv4(),
        role,
        content:
          role === 'user'
            ? 'Can you help me understand this concept?'
            : 'Of course! Let me explain this in a way that makes sense for your learning style...',
        timestamp: new Date(Date.now() - (count - i) * 60000),
        metadata: {
          responseTime: role === 'assistant' ? getRandomNumber(500, 2000) : 0,
          tokenCount: getRandomNumber(50, 200),
          confidence: getRandomNumber(70, 95),
          intent: getRandomElement(['help', 'clarification', 'motivation']),
          topics: ['learning', 'understanding'],
          feedback:
            Math.random() > 0.5
              ? {
                rating: getRandomNumber(3, 5),
                helpful: true,
              }
              : null,
        },
      });
    }

    return messages;
  }

  getPeriodStartDate(periodType) {
    const now = new Date();
    switch (periodType) {
    case 'daily':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return now;
    }
  }

  generateRecommendationTitle(type) {
    const titles = {
      next_module: 'Continue Your Learning Journey',
      learning_path: 'Recommended Learning Path for You',
      review_content: 'Review Previous Content',
      skill_development: 'Develop New Skills',
      schedule_optimization: 'Optimize Your Study Schedule',
      ai_personality: 'Try a Different AI Personality',
    };
    return titles[type] || 'Personalized Recommendation';
  }

  generateRecommendationDescription(type) {
    const descriptions = {
      next_module:
        'Based on your progress, we recommend moving to the next module',
      learning_path: 'This learning path matches your goals and interests',
      review_content: 'Strengthen your understanding by reviewing this content',
      skill_development: 'Expand your skillset with this focused training',
      schedule_optimization: 'Adjust your study schedule for better results',
      ai_personality:
        'A different AI personality might better suit your learning style',
    };
    return descriptions[type] || 'This recommendation is personalized for you';
  }

  getPrimaryAction(type) {
    const actions = {
      next_module: 'Start Next Module',
      learning_path: 'Enroll Now',
      review_content: 'Review Now',
      skill_development: 'Start Training',
      schedule_optimization: 'Update Schedule',
      ai_personality: 'Switch Personality',
    };
    return actions[type] || 'Take Action';
  }

  getSecondaryActions(type) {
    const actions = {
      next_module: ['View Module Details', 'Save for Later'],
      learning_path: ['View Curriculum', 'Read Reviews'],
      review_content: ['Set Reminder', 'View Notes'],
      skill_development: ['View Skills', 'See Prerequisites'],
      schedule_optimization: ['View Current Schedule', 'Set Preferences'],
      ai_personality: ['Try Sample', 'Learn More'],
    };
    return actions[type]?.slice(0, getRandomNumber(1, 2)) || ['Learn More'];
  }

  async displaySummary() {
    console.log('\n📊 Database Seeding Summary:');
    console.log('='.repeat(50));

    const collections = [
      { name: 'Users', model: User },
      { name: 'Learning Paths', model: LearningPath },
      { name: 'Learning Modules', model: LearningModule },
      { name: 'User Progress', model: UserProgress },
      // { name: 'Learning Sessions', model: LearningSession }, // ❌ Removed
      // { name: 'AI Prompts', model: AIPrompt }, // ❌ Removed
      { name: 'AI Sessions', model: AISession },
      { name: 'Assessments', model: Assessment },
      { name: 'Assessment Sessions', model: AssessmentSession },
      { name: 'Certificates', model: Certificate },
      // { name: 'Learning Analytics', model: LearningAnalytics }, // ❌ Removed
      // { name: 'Adaptation Rules', model: AdaptationRule }, // ❌ Removed
      // { name: 'Recommendations', model: RecommendationEngine }, // ❌ Removed
    ];

    let totalDocuments = 0;
    for (const collection of collections) {
      const count = await collection.model.countDocuments();
      console.log(
        `📋 ${collection.name.padEnd(20)}: ${count.toLocaleString()}`,
      );
      totalDocuments += count;
    }

    console.log('='.repeat(50));
    console.log(`📊 Total Documents: ${totalDocuments.toLocaleString()}`);

    console.log('\n🔑 Demo Credentials:');
    console.log('👤 Student: demo@sokol-learning.com / password123');
    console.log('👨‍🏫 Instructor: instructor@sokol-learning.com / instructor123');
    console.log('👨‍💼 Admin: admin@sokol-learning.com / admin123');

    console.log('\n🌐 API Endpoints Ready:');
    console.log('🔐 Auth: http://localhost:3000/api/auth/*');
    console.log('📚 Learning: http://localhost:3000/api/learning-paths/*');
    console.log('📖 Modules: http://localhost:3000/api/modules/*');
    console.log('📈 Progress: http://localhost:3000/api/progress/*');
    console.log('🤖 AI: http://localhost:3000/api/ai/*');
    console.log('📊 Analytics: http://localhost:3000/api/analytics/*');
    console.log(
      '🎯 Recommendations: http://localhost:3000/api/recommendations/*',
    );
    console.log('📝 Assessments: http://localhost:3000/api/assessments/*');
    console.log('🏆 Certificates: http://localhost:3000/api/certificates/*');
  }
}

// Run if called directly
if (require.main === module) {
  const seeder = new ComprehensiveSeeder();
  seeder.run().catch(console.error);
}

module.exports = { ComprehensiveSeeder };
