// seeders/seedOnboardingQuestions.js
require('dotenv').config();
const mongoose = require('mongoose');
const OnboardingQuestion = require('../models/OnboardingQuestion');
const { v4: uuidv4 } = require('uuid');

const onboardingQuestionsData = [
  {
    questionId: 'onboarding_001',
    question: 'What is your primary learning goal?',
    description: 'Understanding your main motivation for using this platform',
    type: 'multiple_choice',
    category: 'motivation',
    options: [
      {
        id: 'career_advancement',
        text: 'Career advancement and promotion',
        value: 'career_advancement',
        weight: 1.0,
        category: 'career',
        nextQuestions: [],
      },
      {
        id: 'skill_development',
        text: 'Developing new technical skills',
        value: 'skill_development',
        weight: 1.0,
        category: 'technical',
        nextQuestions: [],
      },
      {
        id: 'personal_growth',
        text: 'Personal growth and self-improvement',
        value: 'personal_growth',
        weight: 1.0,
        category: 'personal',
        nextQuestions: [],
      },
      {
        id: 'certification',
        text: 'Getting certified in specific areas',
        value: 'certification',
        weight: 1.0,
        category: 'certification',
        nextQuestions: [],
      },
    ],
    aiAnalysisPrompt: 'Analyze the user\'s primary motivation for learning. This helps determine their commitment level and preferred learning approach. Look for indicators of intrinsic vs extrinsic motivation.',
    scoring: {
      weight: 1.5,
      categories: ['motivation', 'career_goals', 'learning_approach'],
    },
    flow: {
      order: 1,
      required: true,
    },
  },
  {
    questionId: 'onboarding_002',
    question: 'How would you describe your current experience level?',
    description: 'Assessing your overall professional and technical background',
    type: 'multiple_choice',
    category: 'experience_level',
    options: [
      {
        id: 'beginner',
        text: 'Beginner - New to the field, learning fundamentals',
        value: 'beginner',
        weight: 1.0,
        category: 'beginner',
        nextQuestions: [],
      },
      {
        id: 'intermediate',
        text: 'Intermediate - Some experience, looking to improve',
        value: 'intermediate',
        weight: 1.0,
        category: 'intermediate',
        nextQuestions: [],
      },
      {
        id: 'advanced',
        text: 'Advanced - Experienced, seeking mastery',
        value: 'advanced',
        weight: 1.0,
        category: 'advanced',
        nextQuestions: [],
      },
      {
        id: 'expert',
        text: 'Expert - Highly skilled, looking for specialization',
        value: 'expert',
        weight: 1.0,
        category: 'expert',
        nextQuestions: [],
      },
    ],
    aiAnalysisPrompt: 'Evaluate the user\'s self-assessment of their experience level. This is crucial for determining appropriate assessment difficulty and learning path recommendations. Consider confidence indicators.',
    scoring: {
      weight: 2.0,
      categories: ['experience_level', 'confidence', 'learning_path'],
    },
    flow: {
      order: 2,
      required: true,
    },
  },
  {
    questionId: 'onboarding_003',
    question: 'What is your preferred learning style?',
    description: 'Understanding how you best absorb and retain information',
    type: 'multiple_choice',
    category: 'learning_style',
    options: [
      {
        id: 'visual',
        text: 'Visual - I learn best through diagrams, charts, and videos',
        value: 'visual',
        weight: 1.0,
        category: 'visual',
        nextQuestions: [],
      },
      {
        id: 'auditory',
        text: 'Auditory - I prefer listening to explanations and discussions',
        value: 'auditory',
        weight: 1.0,
        category: 'auditory',
        nextQuestions: [],
      },
      {
        id: 'kinesthetic',
        text: 'Hands-on - I learn by doing and practicing',
        value: 'kinesthetic',
        weight: 1.0,
        category: 'kinesthetic',
        nextQuestions: [],
      },
      {
        id: 'reading',
        text: 'Reading - I prefer text-based materials and documentation',
        value: 'reading',
        weight: 1.0,
        category: 'reading',
        nextQuestions: [],
      },
    ],
    aiAnalysisPrompt: 'Identify the user\'s primary learning modality preference. This will influence content delivery recommendations, AI personality selection, and assessment format preferences.',
    scoring: {
      weight: 1.8,
      categories: ['learning_style', 'content_preference', 'ai_personality'],
    },
    flow: {
      order: 3,
      required: true,
    },
  },
  {
    questionId: 'onboarding_004',
    question: 'Which technical areas are you most interested in?',
    description: 'Select all that apply to understand your technical focus',
    type: 'multiple_select',
    category: 'interests',
    options: [
      {
        id: 'programming',
        text: 'Programming and Software Development',
        value: 'programming',
        weight: 1.0,
        category: 'technical',
        nextQuestions: [],
      },
      {
        id: 'data_science',
        text: 'Data Science and Analytics',
        value: 'data_science',
        weight: 1.0,
        category: 'technical',
        nextQuestions: [],
      },
      {
        id: 'design',
        text: 'Design and User Experience',
        value: 'design',
        weight: 1.0,
        category: 'creative',
        nextQuestions: [],
      },
      {
        id: 'business',
        text: 'Business Strategy and Management',
        value: 'business',
        weight: 1.0,
        category: 'business',
        nextQuestions: [],
      },
      {
        id: 'leadership',
        text: 'Leadership and Communication',
        value: 'leadership',
        weight: 1.0,
        category: 'soft_skills',
        nextQuestions: [],
      },
    ],
    aiAnalysisPrompt: 'Analyze the user\'s technical and professional interests. This helps create personalized assessment recommendations and learning paths that align with their career goals.',
    scoring: {
      weight: 1.6,
      categories: ['interests', 'career_alignment', 'assessment_recommendations'],
    },
    flow: {
      order: 4,
      required: true,
    },
  },
  {
    questionId: 'onboarding_005',
    question: 'How much time can you dedicate to learning each week?',
    description: 'Understanding your availability for consistent learning',
    type: 'multiple_choice',
    category: 'time_availability',
    options: [
      {
        id: 'less_than_2',
        text: 'Less than 2 hours',
        value: 'less_than_2',
        weight: 1.0,
        category: 'low',
        nextQuestions: [],
      },
      {
        id: '2_to_5',
        text: '2-5 hours',
        value: '2_to_5',
        weight: 1.0,
        category: 'moderate',
        nextQuestions: [],
      },
      {
        id: '5_to_10',
        text: '5-10 hours',
        value: '5_to_10',
        weight: 1.0,
        category: 'high',
        nextQuestions: [],
      },
      {
        id: 'more_than_10',
        text: 'More than 10 hours',
        value: 'more_than_10',
        weight: 1.0,
        category: 'very_high',
        nextQuestions: [],
      },
    ],
    aiAnalysisPrompt: 'Assess the user\'s time commitment to learning. This influences session length recommendations, learning pace, and assessment scheduling preferences.',
    scoring: {
      weight: 1.3,
      categories: ['time_availability', 'learning_pace', 'session_preferences'],
    },
    flow: {
      order: 5,
      required: true,
    },
  },
  {
    questionId: 'onboarding_006',
    question: 'What motivates you to keep learning?',
    description: 'Understanding your intrinsic and extrinsic motivators',
    type: 'short_answer',
    category: 'motivation',
    expectedLength: {
      min: 20,
      max: 200,
    },
    aiAnalysisPrompt: 'Analyze the user\'s motivation drivers and emotional connection to learning. Look for patterns in intrinsic motivation, career goals, personal growth, or external pressures. This helps determine engagement strategies and AI personality recommendations.',
    scoring: {
      weight: 1.4,
      categories: ['motivation', 'engagement', 'ai_personality'],
    },
    flow: {
      order: 6,
      required: true,
    },
  },
  {
    questionId: 'onboarding_007',
    question: 'Describe a recent challenge you faced at work or in learning. How did you approach it?',
    description: 'Understanding your problem-solving approach and resilience',
    type: 'essay',
    category: 'experience_level',
    expectedLength: {
      min: 50,
      max: 300,
    },
    aiAnalysisPrompt: 'Evaluate the user\'s problem-solving methodology, analytical thinking, and resilience. Look for evidence of systematic approaches, creativity, collaboration, and learning from failure. This helps assess their current skill level and identify areas for growth.',
    scoring: {
      weight: 2.2,
      categories: ['problem_solving', 'analytical_thinking', 'resilience', 'skill_level'],
    },
    flow: {
      order: 7,
      required: true,
    },
  },
  {
    questionId: 'onboarding_008',
    question: 'What are your top 3 career goals for the next 2-3 years?',
    description: 'Understanding your professional aspirations and timeline',
    type: 'short_answer',
    category: 'career_goals',
    expectedLength: {
      min: 30,
      max: 250,
    },
    aiAnalysisPrompt: 'Identify the user\'s career trajectory, timeline, and specific goals. Look for clarity of vision, ambition level, and alignment between goals and current skills. This helps create targeted learning paths and assessment recommendations.',
    scoring: {
      weight: 1.9,
      categories: ['career_goals', 'timeline', 'skill_gaps', 'learning_path'],
    },
    flow: {
      order: 8,
      required: true,
    },
  },
  {
    questionId: 'onboarding_009',
    question: 'How do you prefer to receive feedback and guidance?',
    description: 'Understanding your preferred support style',
    type: 'multiple_choice',
    category: 'preferred_format',
    options: [
      {
        id: 'encouraging',
        text: 'Encouraging and supportive - I need motivation and positive reinforcement',
        value: 'encouraging',
        weight: 1.0,
        category: 'supportive',
        nextQuestions: [],
      },
      {
        id: 'detailed',
        text: 'Detailed and analytical - I want comprehensive explanations and deep insights',
        value: 'detailed',
        weight: 1.0,
        category: 'analytical',
        nextQuestions: [],
      },
      {
        id: 'challenging',
        text: 'Challenging and direct - I prefer tough love and high expectations',
        value: 'challenging',
        weight: 1.0,
        category: 'challenging',
        nextQuestions: [],
      },
      {
        id: 'balanced',
        text: 'Balanced approach - Mix of support, detail, and challenge',
        value: 'balanced',
        weight: 1.0,
        category: 'balanced',
        nextQuestions: [],
      },
    ],
    aiAnalysisPrompt: 'Determine the user\'s preferred feedback style and support approach. This directly influences AI personality selection (ARIA for encouraging, SAGE for detailed, COACH for challenging) and assessment feedback tone.',
    scoring: {
      weight: 1.7,
      categories: ['feedback_preference', 'ai_personality', 'support_style'],
    },
    flow: {
      order: 9,
      required: true,
    },
  },
  {
    questionId: 'onboarding_010',
    question: 'What would make this learning experience most valuable for you?',
    description: 'Understanding your specific needs and expectations',
    type: 'essay',
    category: 'preferred_format',
    expectedLength: {
      min: 40,
      max: 300,
    },
    aiAnalysisPrompt: 'Analyze the user\'s specific needs, expectations, and what they value most in a learning experience. Look for practical applications, skill development priorities, career impact, or personal growth areas. This helps customize the entire learning journey and assessment strategy.',
    scoring: {
      weight: 2.0,
      categories: ['learning_needs', 'expectations', 'value_proposition', 'customization'],
    },
    flow: {
      order: 10,
      required: true,
    },
  },
];

async function seedOnboardingQuestions() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('📝 Clearing existing onboarding questions...');
    await OnboardingQuestion.deleteMany({});

    console.log('🌱 Seeding onboarding questions...');
    const createdQuestions = await OnboardingQuestion.insertMany(onboardingQuestionsData);
    
    console.log(`✅ Successfully created ${createdQuestions.length} onboarding questions`);
    
    // Log summary by category
    const categoryCount = {};
    createdQuestions.forEach(q => {
      categoryCount[q.category] = (categoryCount[q.category] || 0) + 1;
    });
    
    console.log('📊 Questions by category:');
    Object.entries(categoryCount).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} questions`);
    });

    // Log question flow order
    console.log('\n📋 Question flow order:');
    createdQuestions
      .sort((a, b) => a.flow.order - b.flow.order)
      .forEach(q => {
        console.log(`   ${q.flow.order}. ${q.questionId}: ${q.question.substring(0, 50)}...`);
      });
    
    console.log('\n🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding onboarding questions:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

if (require.main === module) {
  seedOnboardingQuestions();
}

module.exports = { seedOnboardingQuestions, onboardingQuestionsData };
