// seeders/seedAssessmentsOnly.js
require("dotenv").config();
const mongoose = require("mongoose");
const Assessment = require("../models/Assessment");

// Create a dummy user ID for seeding
const dummyUserId = new mongoose.Types.ObjectId();

const assessmentsData = [
  {
    title: "JavaScript Fundamentals",
    description: "Comprehensive assessment of core JavaScript concepts including ES6+ features, async programming, and DOM manipulation",
    type: "skill_check",
    category: "Technical Skills",
    difficulty: "beginner",
    questions: [], // Empty for now, will be populated by AI generation
    isActive: true,
    isPublished: true,
    createdBy: dummyUserId,
    scoring: {
      totalPoints: 150,
      passingScore: 70,
      perfectScore: 100,
      gradingScale: {
        A: { min: 90, max: 100 },
        B: { min: 80, max: 89 },
        C: { min: 70, max: 79 },
        D: { min: 60, max: 69 },
        F: { min: 0, max: 59 }
      }
    },
    timeConstraints: {
      hasTimeLimit: true,
      totalTimeMinutes: 45,
      allowPause: true,
      warningTimeMinutes: 5
    },
    attemptSettings: {
      maxAttempts: 3,
      retakePolicy: "immediate",
      showResults: "after_completion",
      allowReview: true
    },
    aiFeatures: {
      useAIEvaluation: true,
      personalityType: "ARIA",
      adaptiveDifficulty: false,
      aiGuidance: true
    },
    certification: {
      issuesCertificate: true,
      certificateTemplate: "standard",
      requiredScore: 80
    },
    tags: ["JavaScript", "Web Development", "Programming", "Frontend"],
    analytics: {
      totalAttempts: 245,
      passRate: 72.5,
      averageScore: 76.8,
      averageTimeSpent: 28
    }
  },
  {
    title: "React.js Advanced Patterns",
    description: "Advanced React concepts including hooks, context, performance optimization, and modern patterns",
    type: "skill_check", 
    category: "programming",
    difficulty: "advanced",
    questionCount: 20,
    estimatedDuration: 45,
    isActive: true,
    isPublished: true,
    scoring: {
      passingScore: 75,
      gradingScale: {
        A: { min: 90, max: 100 },
        B: { min: 80, max: 89 },
        C: { min: 75, max: 79 },
        D: { min: 65, max: 74 },
        F: { min: 0, max: 64 }
      }
    },
    timeConstraints: {
      hasTimeLimit: true,
      totalTimeMinutes: 60,
      allowPause: true,
      warningTimeMinutes: 10
    },
    attemptSettings: {
      maxAttempts: 2,
      retakePolicy: "after_24h",
      showResults: "after_completion",
      allowReview: true
    },
    aiFeatures: {
      useAIEvaluation: true,
      personalityType: "SAGE",
      adaptiveDifficulty: true,
      aiGuidance: true
    },
    certification: {
      issuesCertificate: true,
      certificateTemplate: "advanced",
      requiredScore: 85
    },
    tags: ["React", "Frontend", "Advanced", "Hooks", "Performance"],
    analytics: {
      totalAttempts: 156,
      passRate: 64.1,
      averageScore: 73.2,
      averageTimeSpent: 42
    }
  },
  {
    title: "Python Data Science Fundamentals",
    description: "Essential Python skills for data science including pandas, numpy, and basic machine learning",
    type: "skill_check",
    category: "programming", 
    difficulty: "intermediate",
    questionCount: 18,
    estimatedDuration: 40,
    isActive: true,
    isPublished: true,
    scoring: {
      passingScore: 70,
      gradingScale: {
        A: { min: 90, max: 100 },
        B: { min: 80, max: 89 },
        C: { min: 70, max: 79 },
        D: { min: 60, max: 69 },
        F: { min: 0, max: 59 }
      }
    },
    timeConstraints: {
      hasTimeLimit: true,
      totalTimeMinutes: 50,
      allowPause: true,
      warningTimeMinutes: 5
    },
    attemptSettings: {
      maxAttempts: 3,
      retakePolicy: "immediate",
      showResults: "after_completion",
      allowReview: true
    },
    aiFeatures: {
      useAIEvaluation: true,
      personalityType: "COACH",
      adaptiveDifficulty: false,
      aiGuidance: true
    },
    certification: {
      issuesCertificate: true,
      certificateTemplate: "standard",
      requiredScore: 80
    },
    tags: ["Python", "Data Science", "Analytics", "Machine Learning"],
    analytics: {
      totalAttempts: 189,
      passRate: 78.3,
      averageScore: 79.1,
      averageTimeSpent: 38
    }
  },
  {
    title: "SQL Database Management",
    description: "Comprehensive SQL assessment covering queries, joins, stored procedures, and database optimization",
    type: "skill_check",
    category: "data",
    difficulty: "intermediate",
    questionCount: 20,
    estimatedDuration: 40,
    isActive: true,
    isPublished: true,
    scoring: {
      passingScore: 75,
      gradingScale: {
        A: { min: 90, max: 100 },
        B: { min: 80, max: 89 },
        C: { min: 75, max: 79 },
        D: { min: 65, max: 74 },
        F: { min: 0, max: 64 }
      }
    },
    timeConstraints: {
      hasTimeLimit: true,
      totalTimeMinutes: 50,
      allowPause: true,
      warningTimeMinutes: 10
    },
    attemptSettings: {
      maxAttempts: 3,
      retakePolicy: "immediate",
      showResults: "after_completion",
      allowReview: true
    },
    aiFeatures: {
      useAIEvaluation: true,
      personalityType: "SAGE",
      adaptiveDifficulty: false,
      aiGuidance: true
    },
    certification: {
      issuesCertificate: true,
      certificateTemplate: "standard",
      requiredScore: 80
    },
    tags: ["SQL", "Database", "Queries", "Data Management"],
    analytics: {
      totalAttempts: 203,
      passRate: 71.9,
      averageScore: 75.6,
      averageTimeSpent: 37
    }
  },
  {
    title: "Data Visualization with D3.js",
    description: "Creating interactive and dynamic data visualizations using D3.js and modern web technologies",
    type: "skill_check",
    category: "data",
    difficulty: "advanced",
    questionCount: 15,
    estimatedDuration: 35,
    isActive: true,
    isPublished: true,
    scoring: {
      passingScore: 75,
      gradingScale: {
        A: { min: 90, max: 100 },
        B: { min: 80, max: 89 },
        C: { min: 75, max: 79 },
        D: { min: 65, max: 74 },
        F: { min: 0, max: 64 }
      }
    },
    timeConstraints: {
      hasTimeLimit: true,
      totalTimeMinutes: 45,
      allowPause: true,
      warningTimeMinutes: 5
    },
    attemptSettings: {
      maxAttempts: 2,
      retakePolicy: "after_24h",
      showResults: "after_completion", 
      allowReview: true
    },
    aiFeatures: {
      useAIEvaluation: true,
      personalityType: "ARIA",
      adaptiveDifficulty: true,
      aiGuidance: true
    },
    certification: {
      issuesCertificate: true,
      certificateTemplate: "advanced",
      requiredScore: 85
    },
    tags: ["D3.js", "Visualization", "JavaScript", "Data", "Advanced"],
    analytics: {
      totalAttempts: 89,
      passRate: 59.6,
      averageScore: 71.3,
      averageTimeSpent: 33
    }
  },
  {
    title: "Team Leadership Essentials",
    description: "Core leadership principles including team management, communication, and decision-making skills",
    type: "skill_check",
    category: "leadership",
    difficulty: "intermediate",
    questionCount: 12,
    estimatedDuration: 25,
    isActive: true,
    isPublished: true,
    scoring: {
      passingScore: 70,
      gradingScale: {
        A: { min: 90, max: 100 },
        B: { min: 80, max: 89 },
        C: { min: 70, max: 79 },
        D: { min: 60, max: 69 },
        F: { min: 0, max: 59 }
      }
    },
    timeConstraints: {
      hasTimeLimit: true,
      totalTimeMinutes: 35,
      allowPause: true,
      warningTimeMinutes: 5
    },
    attemptSettings: {
      maxAttempts: 3,
      retakePolicy: "immediate",
      showResults: "after_completion",
      allowReview: true
    },
    aiFeatures: {
      useAIEvaluation: true,
      personalityType: "COACH",
      adaptiveDifficulty: false,
      aiGuidance: true
    },
    certification: {
      issuesCertificate: true,
      certificateTemplate: "leadership",
      requiredScore: 80
    },
    tags: ["Leadership", "Management", "Communication", "Soft Skills"],
    analytics: {
      totalAttempts: 167,
      passRate: 82.6,
      averageScore: 81.4,
      averageTimeSpent: 23
    }
  },
  {
    title: "Project Management Fundamentals",
    description: "Essential project management skills including planning, execution, and agile methodologies",
    type: "skill_check",
    category: "business",
    difficulty: "beginner",
    questionCount: 15,
    estimatedDuration: 30,
    isActive: true,
    isPublished: true,
    scoring: {
      passingScore: 70,
      gradingScale: {
        A: { min: 90, max: 100 },
        B: { min: 80, max: 89 },
        C: { min: 70, max: 79 },
        D: { min: 60, max: 69 },
        F: { min: 0, max: 59 }
      }
    },
    timeConstraints: {
      hasTimeLimit: true,
      totalTimeMinutes: 40,
      allowPause: true,
      warningTimeMinutes: 5
    },
    attemptSettings: {
      maxAttempts: 3,
      retakePolicy: "immediate",
      showResults: "after_completion",
      allowReview: true
    },
    aiFeatures: {
      useAIEvaluation: true,
      personalityType: "SAGE",
      adaptiveDifficulty: false,
      aiGuidance: true
    },
    certification: {
      issuesCertificate: true,
      certificateTemplate: "standard",
      requiredScore: 75
    },
    tags: ["Project Management", "Agile", "Planning", "Business"],
    analytics: {
      totalAttempts: 134,
      passRate: 79.1,
      averageScore: 77.8,
      averageTimeSpent: 28
    }
  },
  {
    title: "UI/UX Design Principles",
    description: "Fundamental design principles for creating user-centered interfaces and experiences",
    type: "skill_check",
    category: "design",
    difficulty: "beginner",
    questionCount: 12,
    estimatedDuration: 25,
    isActive: true,
    isPublished: true,
    scoring: {
      passingScore: 70,
      gradingScale: {
        A: { min: 90, max: 100 },
        B: { min: 80, max: 89 },
        C: { min: 70, max: 79 },
        D: { min: 60, max: 69 },
        F: { min: 0, max: 59 }
      }
    },
    timeConstraints: {
      hasTimeLimit: true,
      totalTimeMinutes: 35,
      allowPause: true,
      warningTimeMinutes: 5
    },
    attemptSettings: {
      maxAttempts: 3,
      retakePolicy: "immediate",
      showResults: "after_completion",
      allowReview: true
    },
    aiFeatures: {
      useAIEvaluation: true,
      personalityType: "ARIA",
      adaptiveDifficulty: false,
      aiGuidance: true
    },
    certification: {
      issuesCertificate: true,
      certificateTemplate: "design",
      requiredScore: 75
    },
    tags: ["UI/UX", "Design", "User Experience", "Interface"],
    analytics: {
      totalAttempts: 98,
      passRate: 84.7,
      averageScore: 82.1,
      averageTimeSpent: 24
    }
  }
];

async function seedAssessments() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("📝 Clearing existing assessments...");
    await Assessment.deleteMany({});

    console.log("🌱 Seeding assessments...");
    const createdAssessments = await Assessment.insertMany(assessmentsData);
    
    console.log(`✅ Successfully created ${createdAssessments.length} assessments`);
    
    // Log summary
    const categories = [...new Set(createdAssessments.map(a => a.category))];
    const difficulties = [...new Set(createdAssessments.map(a => a.difficulty))];
    
    console.log(`📊 Categories: ${categories.join(', ')}`);
    console.log(`📈 Difficulties: ${difficulties.join(', ')}`);
    
    console.log("🔌 Disconnecting from MongoDB...");
    await mongoose.disconnect();
    console.log("✅ Database seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding assessments:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedAssessments();
}

module.exports = { seedAssessments, assessmentsData };