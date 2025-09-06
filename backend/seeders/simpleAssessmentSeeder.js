// seeders/simpleAssessmentSeeder.js
require('dotenv').config();
const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');

const dummyUserId = new mongoose.Types.ObjectId();

const assessmentsData = [
  {
    title: 'JavaScript Fundamentals',
    description: 'Test your core JavaScript knowledge including ES6+ features',
    type: 'skill_check',
    category: 'Technical Skills',
    difficulty: 'beginner', 
    questions: [],
    isActive: true,
    isPublished: true,
    createdBy: dummyUserId,
    scoring: {
      totalPoints: 150,
      passingScore: 70,
      perfectScore: 100,
    },
    timeConstraints: {
      hasTimeLimit: true,
      totalTimeMinutes: 45,
      allowPause: true,
      warningTimeMinutes: 5,
    },
    attemptSettings: {
      maxAttempts: 3,
      retakePolicy: 'immediate',
      showResults: 'after_completion',
      allowReview: true,
    },
    aiFeatures: {
      useAIEvaluation: true,
      personalityType: 'ARIA',
      adaptiveDifficulty: false,
      aiGuidance: true,
    },
    certification: {
      issuesCertificate: true,
      certificateTemplate: null,
      requiredScore: 80,
    },
    tags: ['JavaScript', 'Web Development', 'Programming', 'Frontend'],
    analytics: {
      totalAttempts: 245,
      passRate: 72.5,
      averageScore: 76.8,
      averageTimeSpent: 28,
    },
  },
  {
    title: 'React.js Advanced Patterns', 
    description: 'Master React hooks, context, and performance optimization',
    type: 'skill_check',
    category: 'Technical Skills', 
    difficulty: 'advanced',
    questions: [],
    isActive: true,
    isPublished: true,
    createdBy: dummyUserId,
    scoring: {
      totalPoints: 200,
      passingScore: 75,
      perfectScore: 100,
    },
    timeConstraints: {
      hasTimeLimit: true,
      totalTimeMinutes: 60,
      allowPause: true,
      warningTimeMinutes: 10,
    },
    attemptSettings: {
      maxAttempts: 2,
      retakePolicy: 'after_24h',
      showResults: 'after_completion',
      allowReview: true,
    },
    aiFeatures: {
      useAIEvaluation: true,
      personalityType: 'SAGE',
      adaptiveDifficulty: true,
      aiGuidance: true,
    },
    certification: {
      issuesCertificate: true,
      certificateTemplate: null,
      requiredScore: 85,
    },
    tags: ['React', 'Frontend', 'Advanced', 'Hooks', 'Performance'],
    analytics: {
      totalAttempts: 156,
      passRate: 64.1,
      averageScore: 73.2,
      averageTimeSpent: 42,
    },
  },
  {
    title: 'Python Data Science Fundamentals',
    description: 'Python programming with focus on data manipulation',
    type: 'skill_check',
    category: 'Data & Analytics',
    difficulty: 'intermediate',
    questions: [],
    isActive: true,
    isPublished: true,
    createdBy: dummyUserId,
    scoring: {
      totalPoints: 180,
      passingScore: 70,
      perfectScore: 100,
    },
    timeConstraints: {
      hasTimeLimit: true,
      totalTimeMinutes: 50,
      allowPause: true,
      warningTimeMinutes: 5,
    },
    attemptSettings: {
      maxAttempts: 3,
      retakePolicy: 'immediate', 
      showResults: 'after_completion',
      allowReview: true,
    },
    aiFeatures: {
      useAIEvaluation: true,
      personalityType: 'COACH',
      adaptiveDifficulty: false,
      aiGuidance: true,
    },
    certification: {
      issuesCertificate: true,
      certificateTemplate: null,
      requiredScore: 80,
    },
    tags: ['Python', 'Data Science', 'Analytics', 'Machine Learning'],
    analytics: {
      totalAttempts: 189,
      passRate: 78.3,
      averageScore: 79.1,
      averageTimeSpent: 38,
    },
  },
  {
    title: 'Team Leadership Essentials',
    description: 'Core principles of effective team leadership',
    type: 'skill_check',
    category: 'Communication & Leadership',
    difficulty: 'intermediate',
    questions: [],
    isActive: true,
    isPublished: true,
    createdBy: dummyUserId,
    scoring: {
      totalPoints: 120,
      passingScore: 70,
      perfectScore: 100,
    },
    timeConstraints: {
      hasTimeLimit: true,
      totalTimeMinutes: 35,
      allowPause: true,
      warningTimeMinutes: 5,
    },
    attemptSettings: {
      maxAttempts: 3,
      retakePolicy: 'immediate',
      showResults: 'after_completion',
      allowReview: true,
    },
    aiFeatures: {
      useAIEvaluation: true,
      personalityType: 'COACH',
      adaptiveDifficulty: false,
      aiGuidance: true,
    },
    certification: {
      issuesCertificate: true,
      certificateTemplate: null,
      requiredScore: 80,
    },
    tags: ['Leadership', 'Management', 'Communication', 'Soft Skills'],
    analytics: {
      totalAttempts: 167,
      passRate: 82.6,
      averageScore: 81.4,
      averageTimeSpent: 23,
    },
  },
  {
    title: 'Business Strategy Fundamentals',
    description: 'Understanding competitive advantage and market positioning',
    type: 'skill_check',
    category: 'Business Strategy', 
    difficulty: 'intermediate',
    questions: [],
    isActive: true,
    isPublished: true,
    createdBy: dummyUserId,
    scoring: {
      totalPoints: 150,
      passingScore: 70,
      perfectScore: 100,
    },
    timeConstraints: {
      hasTimeLimit: true,
      totalTimeMinutes: 40,
      allowPause: true,
      warningTimeMinutes: 5,
    },
    attemptSettings: {
      maxAttempts: 3,
      retakePolicy: 'immediate',
      showResults: 'after_completion',
      allowReview: true,
    },
    aiFeatures: {
      useAIEvaluation: true,
      personalityType: 'SAGE',
      adaptiveDifficulty: false,
      aiGuidance: true,
    },
    certification: {
      issuesCertificate: true,
      certificateTemplate: null,
      requiredScore: 75,
    },
    tags: ['Strategy', 'Business', 'Management', 'Planning'],
    analytics: {
      totalAttempts: 134,
      passRate: 79.1,
      averageScore: 77.8,
      averageTimeSpent: 28,
    },
  },
  {
    title: 'Creative Problem Solving',
    description: 'Innovative approaches to complex challenges',
    type: 'skill_check',
    category: 'Innovation & Creativity',
    difficulty: 'intermediate',
    questions: [],
    isActive: true,
    isPublished: true,
    createdBy: dummyUserId,
    scoring: {
      totalPoints: 140,
      passingScore: 70,
      perfectScore: 100,
    },
    timeConstraints: {
      hasTimeLimit: true,
      totalTimeMinutes: 35,
      allowPause: true,
      warningTimeMinutes: 5,
    },
    attemptSettings: {
      maxAttempts: 3,
      retakePolicy: 'immediate',
      showResults: 'after_completion',
      allowReview: true,
    },
    aiFeatures: {
      useAIEvaluation: true,
      personalityType: 'ARIA',
      adaptiveDifficulty: false,
      aiGuidance: true,
    },
    certification: {
      issuesCertificate: true,
      certificateTemplate: null,
      requiredScore: 75,
    },
    tags: ['Creativity', 'Innovation', 'Problem Solving', 'Design Thinking'],
    analytics: {
      totalAttempts: 98,
      passRate: 84.7,
      averageScore: 82.1,
      averageTimeSpent: 24,
    },
  },
  {
    title: 'Self-Management & Productivity',
    description: 'Personal effectiveness and time management skills',
    type: 'skill_check', 
    category: 'Personal Development',
    difficulty: 'beginner',
    questions: [],
    isActive: true,
    isPublished: true,
    createdBy: dummyUserId,
    scoring: {
      totalPoints: 100,
      passingScore: 70,
      perfectScore: 100,
    },
    timeConstraints: {
      hasTimeLimit: true,
      totalTimeMinutes: 30,
      allowPause: true,
      warningTimeMinutes: 5,
    },
    attemptSettings: {
      maxAttempts: 3,
      retakePolicy: 'immediate',
      showResults: 'after_completion',
      allowReview: true,
    },
    aiFeatures: {
      useAIEvaluation: true,
      personalityType: 'COACH',
      adaptiveDifficulty: false,
      aiGuidance: true,
    },
    certification: {
      issuesCertificate: true,
      certificateTemplate: null,
      requiredScore: 75,
    },
    tags: ['Productivity', 'Time Management', 'Personal Development', 'Goals'],
    analytics: {
      totalAttempts: 203,
      passRate: 88.2,
      averageScore: 83.5,
      averageTimeSpent: 26,
    },
  },
];

async function seedAssessments() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('📝 Clearing existing assessments...');
    await Assessment.deleteMany({});

    console.log('🌱 Seeding assessments...');
    const createdAssessments = await Assessment.insertMany(assessmentsData);
    
    console.log(`✅ Successfully created ${createdAssessments.length} assessments`);
    
    // Log summary by category
    const categoryCount = {};
    createdAssessments.forEach(a => {
      categoryCount[a.category] = (categoryCount[a.category] || 0) + 1;
    });
    
    console.log('📊 Assessments by category:');
    Object.entries(categoryCount).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} assessments`);
    });
    
    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding assessments:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

if (require.main === module) {
  seedAssessments();
}

module.exports = { seedAssessments, assessmentsData };