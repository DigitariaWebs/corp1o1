// seeders/runSeeders.js
require("dotenv").config();
const mongoose = require("mongoose");

// Import models
const User = require("../models/User");
const LearningPath = require("../models/LearningPath");
const LearningModule = require("../models/LearningModule");
const AIPrompt = require("../models/AIPrompt");
const AdaptationRule = require("../models/AdaptationRule");

// Seeder functions
const seedUsers = async () => {
  console.log("📤 Seeding users...");
  
  const users = [
    {
      email: "demo@sokol-learning.com",
      password: "password123",
      name: "Demo User",
      role: "student",
      learningProfile: {
        learningStyle: "visual",
        aiPersonality: "ARIA",
        goals: ["Communication & Leadership", "Technical Skills"],
        pace: "moderate",
        preferredSessionLength: 30
      },
      isEmailVerified: true
    },
    {
      email: "admin@sokol-learning.com", 
      password: "admin123",
      name: "Admin User",
      role: "admin",
      learningProfile: {
        learningStyle: "reading",
        aiPersonality: "SAGE",
        goals: ["Business Strategy"],
        pace: "fast"
      },
      isEmailVerified: true
    }
  ];

  for (const userData of users) {
    const existingUser = await User.findOne({ email: userData.email });
    if (!existingUser) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${userData.email}`);
    } else {
      console.log(`⏭️  User already exists: ${userData.email}`);
    }
  }
};

const seedLearningPaths = async () => {
  console.log("📤 Seeding learning paths...");

  const learningPaths = [
    {
      title: "Leadership Fundamentals",
      description: "Master the essential skills of effective leadership",
      category: "Communication & Leadership",
      difficulty: "intermediate",
      estimatedDuration: 180, // 3 hours
      skills: ["Leadership", "Communication", "Team Management"],
      prerequisites: [],
      isPublished: true,
      instructor: {
        name: "Dr. Sarah Johnson",
        bio: "Leadership expert with 15+ years experience"
      }
    },
    {
      title: "Creative Problem Solving",
      description: "Develop innovative thinking and problem-solving skills",
      category: "Innovation & Creativity", 
      difficulty: "beginner",
      estimatedDuration: 120, // 2 hours
      skills: ["Creative Thinking", "Problem Solving", "Innovation"],
      prerequisites: [],
      isPublished: true,
      instructor: {
        name: "Mark Thompson",
        bio: "Innovation consultant and design thinking expert"
      }
    },
    {
      title: "Data Analytics Essentials",
      description: "Learn the fundamentals of data analysis and interpretation",
      category: "Data & Analytics",
      difficulty: "intermediate", 
      estimatedDuration: 240, // 4 hours
      skills: ["Data Analysis", "Statistics", "Visualization"],
      prerequisites: [],
      isPublished: true,
      instructor: {
        name: "Dr. Lisa Chen",
        bio: "Data scientist with expertise in analytics and machine learning"
      }
    }
  ];

  for (const pathData of learningPaths) {
    const existingPath = await LearningPath.findOne({ title: pathData.title });
    if (!existingPath) {
      const path = new LearningPath(pathData);
      await path.save();
      console.log(`✅ Created learning path: ${pathData.title}`);
    } else {
      console.log(`⏭️  Learning path already exists: ${pathData.title}`);
    }
  }
};

const seedLearningModules = async () => {
  console.log("📤 Seeding learning modules...");

  // Get learning paths
  const leadershipPath = await LearningPath.findOne({ title: "Leadership Fundamentals" });
  const creativityPath = await LearningPath.findOne({ title: "Creative Problem Solving" });
  const analyticsPath = await LearningPath.findOne({ title: "Data Analytics Essentials" });

  const modules = [
    // Leadership modules
    {
      title: "Introduction to Leadership",
      description: "Understand the foundations of effective leadership",
      learningPath: leadershipPath._id,
      category: "Communication & Leadership",
      difficulty: "beginner",
      estimatedDuration: 45,
      orderIndex: 1,
      content: {
        videoUrl: "https://example.com/intro-leadership.mp4",
        textContent: "Leadership is the ability to influence and guide others towards achieving common goals...",
        resources: [
          {
            title: "Leadership Styles Guide",
            type: "pdf",
            url: "https://example.com/leadership-styles.pdf"
          }
        ]
      },
      learningObjectives: [
        "Define leadership and its key characteristics",
        "Identify different leadership styles",
        "Understand the role of emotional intelligence in leadership"
      ],
      skills: ["Leadership", "Communication"],
      isPublished: true
    },
    {
      title: "Communication for Leaders",
      description: "Master effective communication techniques for leaders",
      learningPath: leadershipPath._id,
      category: "Communication & Leadership", 
      difficulty: "intermediate",
      estimatedDuration: 60,
      orderIndex: 2,
      content: {
        videoUrl: "https://example.com/leader-communication.mp4",
        textContent: "Effective communication is the cornerstone of great leadership...",
        interactiveElements: [
          {
            type: "scenario",
            title: "Difficult Conversation Simulator"
          }
        ]
      },
      learningObjectives: [
        "Practice active listening techniques",
        "Learn to give constructive feedback",
        "Handle difficult conversations effectively"
      ],
      skills: ["Communication", "Leadership", "Emotional Intelligence"],
      isPublished: true
    },

    // Creativity modules
    {
      title: "Understanding Creativity",
      description: "Explore the nature of creativity and innovative thinking",
      learningPath: creativityPath._id,
      category: "Innovation & Creativity",
      difficulty: "beginner", 
      estimatedDuration: 40,
      orderIndex: 1,
      content: {
        textContent: "Creativity is the ability to generate novel and useful ideas...",
        interactiveElements: [
          {
            type: "brainstorming_exercise",
            title: "Creative Idea Generation"
          }
        ]
      },
      learningObjectives: [
        "Define creativity and innovation",
        "Identify barriers to creative thinking",
        "Practice ideation techniques"
      ],
      skills: ["Creative Thinking", "Innovation"],
      isPublished: true
    },

    // Analytics modules  
    {
      title: "Data Analytics Fundamentals",
      description: "Introduction to data analysis concepts and methods",
      learningPath: analyticsPath._id,
      category: "Data & Analytics",
      difficulty: "beginner",
      estimatedDuration: 50,
      orderIndex: 1,
      content: {
        textContent: "Data analytics involves examining datasets to draw conclusions...",
        resources: [
          {
            title: "Sample Dataset",
            type: "csv", 
            url: "https://example.com/sample-data.csv"
          }
        ]
      },
      learningObjectives: [
        "Understand types of data and analytics",
        "Learn basic statistical concepts",
        "Practice data interpretation"
      ],
      skills: ["Data Analysis", "Statistics"],
      isPublished: true
    }
  ];

  for (const moduleData of modules) {
    const existingModule = await LearningModule.findOne({ 
      title: moduleData.title,
      learningPath: moduleData.learningPath 
    });
    
    if (!existingModule) {
      const module = new LearningModule(moduleData);
      await module.save();
      console.log(`✅ Created module: ${moduleData.title}`);
    } else {
      console.log(`⏭️  Module already exists: ${moduleData.title}`);
    }
  }
};

const seedAIPrompts = async () => {
  console.log("📤 Seeding AI prompts...");
  
  try {
    const promptCount = await AIPrompt.countDocuments();
    if (promptCount === 0) {
      await AIPrompt.createDefaults();
      console.log("✅ Created default AI prompts");
    } else {
      console.log("⏭️  AI prompts already exist");
    }
  } catch (error) {
    console.error("❌ Error seeding AI prompts:", error);
  }
};

const seedAdaptationRules = async () => {
  console.log("📤 Seeding adaptation rules...");
  
  try {
    const ruleCount = await AdaptationRule.countDocuments();
    if (ruleCount === 0) {
      await AdaptationRule.createDefaults();
      console.log("✅ Created default adaptation rules");
    } else {
      console.log("⏭️  Adaptation rules already exist");
    }
  } catch (error) {
    console.error("❌ Error seeding adaptation rules:", error);
  }
};

// Main seeder function
const runSeeders = async () => {
  try {
    console.log("🌱 Starting database seeding...");
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Database: ${process.env.MONGODB_URI}`);

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Run seeders in order
    await seedUsers();
    await seedLearningPaths();
    await seedLearningModules();
    await seedAIPrompts();
    await seedAdaptationRules();

    console.log("🎉 Database seeding completed successfully!");
    
    // Display summary
    const userCount = await User.countDocuments();
    const pathCount = await LearningPath.countDocuments();
    const moduleCount = await LearningModule.countDocuments();
    const promptCount = await AIPrompt.countDocuments();
    const ruleCount = await AdaptationRule.countDocuments();

    console.log("\n📊 Database Summary:");
    console.log(`👥 Users: ${userCount}`);
    console.log(`📚 Learning Paths: ${pathCount}`);
    console.log(`📖 Modules: ${moduleCount}`);
    console.log(`🤖 AI Prompts: ${promptCount}`);
    console.log(`⚙️  Adaptation Rules: ${ruleCount}`);

    console.log("\n🔑 Demo Credentials:");
    console.log("Email: demo@sokol-learning.com");
    console.log("Password: password123");
    console.log("\nAdmin Credentials:");
    console.log("Email: admin@sokol-learning.com");
    console.log("Password: admin123");

  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  runSeeders();
}

module.exports = { runSeeders };