#!/usr/bin/env node

/**
 * Database Setup Script for Skills Assessment System
 * 
 * This script sets up all necessary database indexes and optimizations
 * for the Corp1o1 Skills Assessment System.
 * 
 * Usage:
 *   node scripts/setup-database.js
 *   npm run setup:database
 * 
 * Options:
 *   --drop-indexes    Drop existing indexes before creating new ones
 *   --stats          Show index usage statistics
 *   --dry-run        Show what would be created without making changes
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { createPerformanceIndexes, dropCustomIndexes, getIndexStats } = require('../config/database-indexes');

// Command line arguments
const args = process.argv.slice(2);
const shouldDropIndexes = args.includes('--drop-indexes');
const showStats = args.includes('--stats');
const dryRun = args.includes('--dry-run');

// Database connection
const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/corp101';
    
    console.log('🔌 Connecting to MongoDB...');
    console.log(`   URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Verify database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📚 Database: ${dbName}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
};

// Main setup function
const setupDatabase = async () => {
  console.log('🚀 Skills Assessment System Database Setup');
  console.log('===========================================\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  try {
    // Connect to database
    await connectDatabase();
    
    // Show current status
    console.log('📊 Current Database Status:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   Collections: ${collections.length}`);
    collections.forEach(col => {
      console.log(`   • ${col.name}`);
    });
    console.log('');
    
    // Drop existing indexes if requested
    if (shouldDropIndexes && !dryRun) {
      console.log('🗑️  Dropping existing custom indexes...');
      await dropCustomIndexes();
      console.log('');
    }
    
    // Create performance indexes
    if (!dryRun) {
      console.log('🔧 Creating performance indexes...');
      await createPerformanceIndexes();
      console.log('');
    } else {
      console.log('🔍 Would create performance indexes (DRY RUN)');
      console.log('   • User collection: 12 indexes');
      console.log('   • SkillCategory collection: 10 indexes');
      console.log('   • Assessment collection: 14 indexes');
      console.log('   • AssessmentSession collection: 16 indexes');
      console.log('   • Question collection: 18 indexes');
      console.log('   • Compound indexes: 6 indexes');
      console.log('');
    }
    
    // Show index statistics if requested
    if (showStats && !dryRun) {
      console.log('📈 Index Usage Statistics:');
      await getIndexStats();
    }
    
    // Create sample data (if needed)
    if (!dryRun) {
      await createSampleSkillCategories();
    }
    
    console.log('✅ Database setup completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Verify indexes: db.collection.getIndexes()');
    console.log('   2. Monitor query performance: db.collection.explain()');
    console.log('   3. Review index usage: db.collection.aggregate([{$indexStats: {}}])');
    console.log('   4. Start building assessment APIs');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

/**
 * Create sample skill categories for testing
 */
const createSampleSkillCategories = async () => {
  try {
    const SkillCategory = require('../models/SkillCategory');
    
    // Check if categories already exist
    const existingCount = await SkillCategory.countDocuments();
    if (existingCount > 0) {
      console.log(`📂 Found ${existingCount} existing skill categories`);
      return;
    }
    
    console.log('📂 Creating sample skill categories...');
    
    // Create a sample admin user ID (you'll need to replace this with real user ID)
    const sampleUserId = new mongoose.Types.ObjectId();
    
    const sampleCategories = [
      {
        name: 'Programming',
        displayName: 'Programming & Development',
        description: 'Software development, coding, and programming fundamentals',
        type: 'technical',
        icon: 'Code',
        color: '#22d3ee',
        difficultyLevels: [
          { level: 'beginner', name: 'Beginner', description: 'Basic syntax and concepts', minScore: 0, maxScore: 69 },
          { level: 'intermediate', name: 'Intermediate', description: 'Problem solving and frameworks', minScore: 70, maxScore: 84 },
          { level: 'advanced', name: 'Advanced', description: 'Complex algorithms and architecture', minScore: 85, maxScore: 94 },
          { level: 'expert', name: 'Expert', description: 'System design and optimization', minScore: 95, maxScore: 100 },
        ],
        skills: [
          { name: 'JavaScript', description: 'Modern JavaScript programming', tags: ['frontend', 'backend', 'web'] },
          { name: 'Python', description: 'Python programming language', tags: ['backend', 'data-science', 'ai'] },
          { name: 'React', description: 'React.js framework', tags: ['frontend', 'ui', 'web'] },
          { name: 'Node.js', description: 'Server-side JavaScript', tags: ['backend', 'api', 'web'] },
        ],
        createdBy: sampleUserId,
        tags: ['coding', 'software', 'development', 'tech'],
        isFeatured: true,
        sortOrder: 1,
      },
      {
        name: 'Design',
        displayName: 'Design & Creativity',
        description: 'Visual design, UI/UX, and creative problem solving',
        type: 'creative',
        icon: 'Palette',
        color: '#f59e0b',
        difficultyLevels: [
          { level: 'beginner', name: 'Beginner', description: 'Basic design principles', minScore: 0, maxScore: 69 },
          { level: 'intermediate', name: 'Intermediate', description: 'Tool proficiency and workflows', minScore: 70, maxScore: 84 },
          { level: 'advanced', name: 'Advanced', description: 'Advanced techniques and theory', minScore: 85, maxScore: 94 },
          { level: 'expert', name: 'Expert', description: 'Design leadership and innovation', minScore: 95, maxScore: 100 },
        ],
        skills: [
          { name: 'UI Design', description: 'User interface design', tags: ['ui', 'visual', 'web'] },
          { name: 'UX Research', description: 'User experience research', tags: ['ux', 'research', 'users'] },
          { name: 'Figma', description: 'Figma design tool', tags: ['tool', 'design', 'collaboration'] },
          { name: 'Graphic Design', description: 'Visual communication design', tags: ['graphics', 'branding', 'visual'] },
        ],
        createdBy: sampleUserId,
        tags: ['design', 'creative', 'visual', 'ui', 'ux'],
        isFeatured: true,
        sortOrder: 2,
      },
      {
        name: 'Business Strategy',
        displayName: 'Business Strategy & Management',
        description: 'Strategic thinking, business analysis, and leadership skills',
        type: 'business',
        icon: 'TrendingUp',
        color: '#10b981',
        difficultyLevels: [
          { level: 'beginner', name: 'Beginner', description: 'Basic business concepts', minScore: 0, maxScore: 69 },
          { level: 'intermediate', name: 'Intermediate', description: 'Strategy development', minScore: 70, maxScore: 84 },
          { level: 'advanced', name: 'Advanced', description: 'Complex business analysis', minScore: 85, maxScore: 94 },
          { level: 'expert', name: 'Expert', description: 'Executive strategy and vision', minScore: 95, maxScore: 100 },
        ],
        skills: [
          { name: 'Strategic Planning', description: 'Long-term business planning', tags: ['strategy', 'planning', 'growth'] },
          { name: 'Financial Analysis', description: 'Business financial analysis', tags: ['finance', 'analysis', 'metrics'] },
          { name: 'Project Management', description: 'Project planning and execution', tags: ['management', 'planning', 'execution'] },
          { name: 'Market Research', description: 'Market analysis and insights', tags: ['research', 'market', 'analysis'] },
        ],
        createdBy: sampleUserId,
        tags: ['business', 'strategy', 'management', 'leadership'],
        isFeatured: true,
        sortOrder: 3,
      },
      {
        name: 'Communication',
        displayName: 'Communication & Leadership',
        description: 'Communication skills, leadership, and team collaboration',
        type: 'soft-skills',
        icon: 'MessageCircle',
        color: '#8b5cf6',
        difficultyLevels: [
          { level: 'beginner', name: 'Beginner', description: 'Basic communication skills', minScore: 0, maxScore: 69 },
          { level: 'intermediate', name: 'Intermediate', description: 'Team communication', minScore: 70, maxScore: 84 },
          { level: 'advanced', name: 'Advanced', description: 'Leadership communication', minScore: 85, maxScore: 94 },
          { level: 'expert', name: 'Expert', description: 'Executive presence', minScore: 95, maxScore: 100 },
        ],
        skills: [
          { name: 'Public Speaking', description: 'Presentation and speaking skills', tags: ['speaking', 'presentation', 'confidence'] },
          { name: 'Team Leadership', description: 'Leading and motivating teams', tags: ['leadership', 'teams', 'motivation'] },
          { name: 'Written Communication', description: 'Professional writing skills', tags: ['writing', 'documentation', 'clarity'] },
          { name: 'Conflict Resolution', description: 'Managing conflicts and negotiations', tags: ['conflict', 'negotiation', 'resolution'] },
        ],
        createdBy: sampleUserId,
        tags: ['communication', 'leadership', 'soft-skills', 'teamwork'],
        isFeatured: true,
        sortOrder: 4,
      },
    ];
    
    for (const categoryData of sampleCategories) {
      try {
        await SkillCategory.create(categoryData);
        console.log(`   ✓ Created: ${categoryData.displayName}`);
      } catch (error) {
        console.log(`   ⚠️  Error creating ${categoryData.name}: ${error.message}`);
      }
    }
    
    console.log(`✅ Created ${sampleCategories.length} sample skill categories`);
    
  } catch (error) {
    console.log(`⚠️  Error creating sample categories: ${error.message}`);
  }
};

// Display help
const showHelp = () => {
  console.log(`
Skills Assessment Database Setup Script
======================================

Usage: node scripts/setup-database.js [options]

Options:
  --drop-indexes    Drop existing custom indexes before creating new ones
  --stats          Show index usage statistics after setup
  --dry-run        Preview changes without executing them
  --help           Show this help message

Examples:
  node scripts/setup-database.js                    # Basic setup
  node scripts/setup-database.js --drop-indexes     # Reset and recreate indexes
  node scripts/setup-database.js --stats           # Setup with statistics
  node scripts/setup-database.js --dry-run         # Preview changes

Environment Variables:
  MONGODB_URI      MongoDB connection string (default: mongodb://localhost:27017/corp101)
`);
};

// Handle help flag
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run the setup
setupDatabase().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});