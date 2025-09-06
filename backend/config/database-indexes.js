// Database indexes configuration for Skills Assessment System
// This file contains all database optimization indexes for performance

const mongoose = require('mongoose');

// Collection references
const collections = {
  users: 'users',
  skillcategories: 'skillcategories', 
  assessments: 'assessments',
  assessmentsessions: 'assessmentsessions',
  questions: 'questions',
};

/**
 * Create all performance optimization indexes
 * Run this after database connection is established
 */
const createPerformanceIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    
    console.log('🔧 Creating performance indexes for Skills Assessment System...');

    // User Collection Indexes (Assessment-focused)
    await createUserIndexes(db);
    
    // SkillCategory Collection Indexes  
    await createSkillCategoryIndexes(db);
    
    // Assessment Collection Indexes
    await createAssessmentIndexes(db);
    
    // AssessmentSession Collection Indexes
    await createAssessmentSessionIndexes(db);
    
    // Question Collection Indexes
    await createQuestionIndexes(db);
    
    // Compound indexes for complex queries
    await createCompoundIndexes(db);
    
    console.log('✅ All performance indexes created successfully');
    
    // Print index information
    await printIndexInformation(db);
    
  } catch (error) {
    console.error('❌ Error creating performance indexes:', error);
    throw error;
  }
};

/**
 * User collection indexes for assessment functionality
 */
const createUserIndexes = async (db) => {
  const collection = db.collection(collections.users);
  
  // Existing auth indexes are already in User model
  
  // Skills progress indexes
  await collection.createIndex(
    { 'skillsProgress.overallLevel': 1 }, 
    { name: 'skills_overall_level' },
  );
  
  await collection.createIndex(
    { 'skillsProgress.skillAssessments.categoryId': 1 }, 
    { name: 'skills_category_lookup' },
  );
  
  await collection.createIndex(
    { 'skillsProgress.skillAssessments.currentLevel': 1 }, 
    { name: 'skills_current_level' },
  );
  
  await collection.createIndex(
    { 'skillsProgress.skillAssessments.lastAssessmentAt': -1 }, 
    { name: 'skills_last_assessment' },
  );
  
  await collection.createIndex(
    { 'skillsProgress.recentAssessments.completedAt': -1 }, 
    { name: 'recent_assessments_time' },
  );
  
  // Achievement indexes
  await collection.createIndex(
    { 'achievements.streaks.currentStreak': -1 }, 
    { name: 'achievement_streaks' },
  );
  
  await collection.createIndex(
    { 'achievements.skillMilestones.categoryId': 1, 'achievements.skillMilestones.achievedAt': -1 }, 
    { name: 'skill_milestones_lookup' },
  );
  
  // Statistics indexes
  await collection.createIndex(
    { 'statistics.totalAssessmentsTaken': -1 }, 
    { name: 'total_assessments_ranking' },
  );
  
  await collection.createIndex(
    { 'statistics.averageAssessmentScore': -1 }, 
    { name: 'average_score_ranking' },
  );
  
  // Learning behavior indexes
  await collection.createIndex(
    { 'learningBehavior.preferredDifficulty': 1 }, 
    { name: 'learning_difficulty_preference' },
  );
  
  await collection.createIndex(
    { 'learningBehavior.peakPerformanceHours': 1 }, 
    { name: 'peak_performance_hours' },
  );
  
  console.log('✓ User collection indexes created');
};

/**
 * SkillCategory collection indexes
 */
const createSkillCategoryIndexes = async (db) => {
  const collection = db.collection(collections.skillcategories);
  
  // Basic lookup indexes (already in model, but ensuring they exist)
  await collection.createIndex(
    { name: 1 }, 
    { name: 'category_name_lookup' },
  );
  
  await collection.createIndex(
    { slug: 1 }, 
    { name: 'category_slug_lookup', unique: true },
  );
  
  await collection.createIndex(
    { type: 1 }, 
    { name: 'category_type_filter' },
  );
  
  // Active and public categories for user-facing queries
  await collection.createIndex(
    { isActive: 1, isPublic: 1 }, 
    { name: 'active_public_categories' },
  );
  
  // Featured categories with sort order
  await collection.createIndex(
    { isFeatured: 1, sortOrder: 1 }, 
    { name: 'featured_categories_ordered' },
  );
  
  // Skills within categories
  await collection.createIndex(
    { 'skills.name': 1 }, 
    { name: 'category_skills_lookup' },
  );
  
  // Tags for search functionality
  await collection.createIndex(
    { tags: 1 }, 
    { name: 'category_tags_search' },
  );
  
  // Statistics for analytics
  await collection.createIndex(
    { 'statistics.popularityRank': -1 }, 
    { name: 'category_popularity_ranking' },
  );
  
  await collection.createIndex(
    { 'statistics.averageScore': -1 }, 
    { name: 'category_performance_ranking' },
  );
  
  // Creation time for admin queries
  await collection.createIndex(
    { createdAt: -1 }, 
    { name: 'category_creation_time' },
  );
  
  // Text search index for name, displayName, description
  await collection.createIndex(
    { 
      name: 'text', 
      displayName: 'text', 
      description: 'text',
      'skills.name': 'text',
      tags: 'text',
    }, 
    { 
      name: 'category_text_search',
      weights: {
        name: 10,
        displayName: 8,
        'skills.name': 6,
        description: 4,
        tags: 2,
      },
    },
  );
  
  console.log('✓ SkillCategory collection indexes created');
};

/**
 * Assessment collection indexes
 */
const createAssessmentIndexes = async (db) => {
  const collection = db.collection(collections.assessments);
  
  // Basic filtering indexes
  await collection.createIndex(
    { category: 1, difficulty: 1, isActive: 1 }, 
    { name: 'assessment_category_difficulty' },
  );
  
  await collection.createIndex(
    { type: 1, isPublished: 1 }, 
    { name: 'assessment_type_published' },
  );
  
  // Learning path relationships
  await collection.createIndex(
    { relatedPaths: 1 }, 
    { name: 'assessment_related_paths' },
  );
  
  await collection.createIndex(
    { relatedModules: 1 }, 
    { name: 'assessment_related_modules' },
  );
  
  // Visibility and access control
  await collection.createIndex(
    { visibility: 1, isActive: 1, isPublished: 1 }, 
    { name: 'assessment_visibility_access' },
  );
  
  // Prerequisites lookup
  await collection.createIndex(
    { 'prerequisites.completedPaths': 1 }, 
    { name: 'assessment_prerequisite_paths' },
  );
  
  await collection.createIndex(
    { 'prerequisites.completedModules': 1 }, 
    { name: 'assessment_prerequisite_modules' },
  );
  
  // Analytics and performance
  await collection.createIndex(
    { 'analytics.averageScore': -1 }, 
    { name: 'assessment_performance_ranking' },
  );
  
  await collection.createIndex(
    { 'analytics.totalAttempts': -1 }, 
    { name: 'assessment_popularity_ranking' },
  );
  
  await collection.createIndex(
    { 'analytics.passRate': -1 }, 
    { name: 'assessment_pass_rate_ranking' },
  );
  
  // Certification integration
  await collection.createIndex(
    { 'certification.issuesCertificate': 1, 'certification.requiredScore': 1 }, 
    { name: 'assessment_certification_lookup' },
  );
  
  // Tags and search
  await collection.createIndex(
    { tags: 1 }, 
    { name: 'assessment_tags_search' },
  );
  
  // Creator and time-based queries
  await collection.createIndex(
    { createdBy: 1, createdAt: -1 }, 
    { name: 'assessment_creator_time' },
  );
  
  await collection.createIndex(
    { createdAt: -1 }, 
    { name: 'assessment_recent_first' },
  );
  
  // Questions within assessment
  await collection.createIndex(
    { 'questions.difficulty': 1, 'questions.isActive': 1 }, 
    { name: 'assessment_questions_difficulty' },
  );
  
  await collection.createIndex(
    { 'questions.type': 1, 'questions.isActive': 1 }, 
    { name: 'assessment_questions_type' },
  );
  
  console.log('✓ Assessment collection indexes created');
};

/**
 * AssessmentSession collection indexes
 */
const createAssessmentSessionIndexes = async (db) => {
  const collection = db.collection(collections.assessmentsessions);
  
  // Primary lookup indexes
  await collection.createIndex(
    { sessionId: 1 }, 
    { name: 'session_id_lookup', unique: true },
  );
  
  await collection.createIndex(
    { userId: 1, assessmentId: 1, startTime: -1 }, 
    { name: 'user_assessment_attempts' },
  );
  
  // Session status and activity monitoring
  await collection.createIndex(
    { status: 1, lastActivity: -1 }, 
    { name: 'session_status_activity' },
  );
  
  await collection.createIndex(
    { userId: 1, status: 1 }, 
    { name: 'user_session_status' },
  );
  
  await collection.createIndex(
    { assessmentId: 1, status: 1 }, 
    { name: 'assessment_session_status' },
  );
  
  // Time-based queries for cleanup and analytics
  await collection.createIndex(
    { startTime: -1 }, 
    { name: 'session_start_time' },
  );
  
  await collection.createIndex(
    { endTime: -1 }, 
    { name: 'session_end_time' },
  );
  
  await collection.createIndex(
    { lastActivity: -1 }, 
    { name: 'session_last_activity' },
  );
  
  // Results and performance analysis
  await collection.createIndex(
    { 'results.finalScore': -1, 'results.passed': 1 }, 
    { name: 'session_performance_ranking' },
  );
  
  await collection.createIndex(
    { 'results.totalTimeSpent': 1 }, 
    { name: 'session_time_analysis' },
  );
  
  // Security and review flags
  await collection.createIndex(
    { 'notes.reviewRequired': 1, 'notes.reviewedAt': 1 }, 
    { name: 'session_review_queue' },
  );
  
  await collection.createIndex(
    { 'environment.securityFlags.type': 1, 'environment.securityFlags.timestamp': -1 }, 
    { name: 'session_security_flags' },
  );
  
  // User context and analytics
  await collection.createIndex(
    { 'userContext.deviceType': 1 }, 
    { name: 'session_device_analytics' },
  );
  
  await collection.createIndex(
    { 'userContext.timezone': 1 }, 
    { name: 'session_timezone_analytics' },
  );
  
  // Answer analysis
  await collection.createIndex(
    { 'answers.questionId': 1, 'answers.isCorrect': 1 }, 
    { name: 'session_answer_analysis' },
  );
  
  // AI assistance tracking
  await collection.createIndex(
    { 'aiAssistance.hintsProvided.questionId': 1 }, 
    { name: 'session_ai_hints' },
  );
  
  console.log('✓ AssessmentSession collection indexes created');
};

/**
 * Question collection indexes
 */
const createQuestionIndexes = async (db) => {
  const collection = db.collection(collections.questions);
  
  // Primary lookup indexes
  await collection.createIndex(
    { questionId: 1 }, 
    { name: 'question_id_lookup', unique: true },
  );
  
  // Assessment and category relationships
  await collection.createIndex(
    { assessmentId: 1, isActive: 1 }, 
    { name: 'question_assessment_active' },
  );
  
  await collection.createIndex(
    { categoryId: 1, difficulty: 1 }, 
    { name: 'question_category_difficulty' },
  );
  
  // Question type and status filtering
  await collection.createIndex(
    { type: 1, status: 1 }, 
    { name: 'question_type_status' },
  );
  
  await collection.createIndex(
    { difficulty: 1, cognitiveLevel: 1 }, 
    { name: 'question_difficulty_cognitive' },
  );
  
  // Skills and tags
  await collection.createIndex(
    { 'skills.name': 1, 'skills.level': 1 }, 
    { name: 'question_skills_lookup' },
  );
  
  await collection.createIndex(
    { tags: 1 }, 
    { name: 'question_tags_search' },
  );
  
  // Active and public questions
  await collection.createIndex(
    { isActive: 1, isPublic: 1, status: 1 }, 
    { name: 'question_public_active' },
  );
  
  // Performance analytics
  await collection.createIndex(
    { 'analytics.correctPercentage': -1 }, 
    { name: 'question_difficulty_ranking' },
  );
  
  await collection.createIndex(
    { 'analytics.averageScore': -1 }, 
    { name: 'question_performance_ranking' },
  );
  
  await collection.createIndex(
    { 'analytics.timesUsed': -1 }, 
    { name: 'question_usage_ranking' },
  );
  
  // Quality metrics
  await collection.createIndex(
    { 'analytics.userRatings.averageRating': -1 }, 
    { name: 'question_rating_ranking' },
  );
  
  await collection.createIndex(
    { 'analytics.flaggedForReview': -1, 'analytics.reportedIssues': -1 }, 
    { name: 'question_quality_issues' },
  );
  
  // AI evaluation
  await collection.createIndex(
    { 'aiConfig.enabled': 1, 'aiConfig.provider': 1 }, 
    { name: 'question_ai_evaluation' },
  );
  
  // Quality review process
  await collection.createIndex(
    { 'qualityReview.reviewStatus': 1, 'qualityReview.reviewedAt': -1 }, 
    { name: 'question_review_queue' },
  );
  
  await collection.createIndex(
    { 'qualityReview.qualityScore': -1 }, 
    { name: 'question_quality_ranking' },
  );
  
  // Creation and modification tracking
  await collection.createIndex(
    { createdBy: 1, createdAt: -1 }, 
    { name: 'question_creator_time' },
  );
  
  await collection.createIndex(
    { createdAt: -1 }, 
    { name: 'question_recent_first' },
  );
  
  await collection.createIndex(
    { lastModifiedBy: 1, updatedAt: -1 }, 
    { name: 'question_last_modified' },
  );
  
  // Text search index
  await collection.createIndex(
    {
      title: 'text',
      question: 'text', 
      description: 'text',
      tags: 'text',
      keywords: 'text',
    }, 
    { 
      name: 'question_text_search',
      weights: {
        title: 10,
        question: 8,
        keywords: 6,
        tags: 4,
        description: 2,
      },
    },
  );
  
  console.log('✓ Question collection indexes created');
};

/**
 * Create compound indexes for complex cross-collection queries
 */
const createCompoundIndexes = async (db) => {
  // User skill progression compound indexes
  const usersCollection = db.collection(collections.users);
  
  await usersCollection.createIndex(
    { 
      'skillsProgress.overallLevel': 1, 
      'statistics.totalAssessmentsTaken': -1,
      'achievements.streaks.currentStreak': -1,
    }, 
    { name: 'user_skill_progression_ranking' },
  );
  
  await usersCollection.createIndex(
    {
      'skillsProgress.skillAssessments.categoryId': 1,
      'skillsProgress.skillAssessments.currentLevel': 1,
      'skillsProgress.skillAssessments.lastAssessmentAt': -1,
    },
    { name: 'user_category_skill_timeline' },
  );
  
  // Assessment difficulty distribution
  const questionsCollection = db.collection(collections.questions);
  
  await questionsCollection.createIndex(
    {
      categoryId: 1,
      difficulty: 1,
      type: 1,
      isActive: 1,
      status: 1,
    },
    { name: 'question_selection_criteria' },
  );
  
  await questionsCollection.createIndex(
    {
      assessmentId: 1,
      difficulty: 1,
      'analytics.correctPercentage': -1,
      isActive: 1,
    },
    { name: 'adaptive_question_selection' },
  );
  
  // Session analytics compound indexes
  const sessionsCollection = db.collection(collections.assessmentsessions);
  
  await sessionsCollection.createIndex(
    {
      assessmentId: 1,
      status: 1,
      'results.finalScore': -1,
      startTime: -1,
    },
    { name: 'assessment_performance_timeline' },
  );
  
  await sessionsCollection.createIndex(
    {
      userId: 1,
      'results.passed': 1,
      'results.finalScore': -1,
      endTime: -1,
    },
    { name: 'user_success_progression' },
  );
  
  console.log('✓ Compound indexes created');
};

/**
 * Print information about created indexes
 */
const printIndexInformation = async (db) => {
  console.log('\n📊 Database Index Summary:');
  console.log('================================');
  
  for (const [name, collection] of Object.entries(collections)) {
    try {
      const coll = db.collection(collection);
      const indexes = await coll.listIndexes().toArray();
      console.log(`\n${name.toUpperCase()} (${indexes.length} indexes):`);
      
      indexes.forEach(index => {
        const keyString = Object.keys(index.key).map(key => 
          `${key}:${index.key[key]}`,
        ).join(', ');
        console.log(`  • ${index.name || 'unnamed'}: {${keyString}}`);
      });
    } catch (error) {
      console.log(`  ⚠️  Collection ${collection} not found or error: ${error.message}`);
    }
  }
  
  console.log('\n================================\n');
};

/**
 * Drop all custom indexes (for testing/reset purposes)
 */
const dropCustomIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    
    console.log('🗑️  Dropping custom indexes...');
    
    for (const collection of Object.values(collections)) {
      try {
        const coll = db.collection(collection);
        const indexes = await coll.listIndexes().toArray();
        
        for (const index of indexes) {
          // Don't drop the default _id index
          if (index.name !== '_id_') {
            try {
              await coll.dropIndex(index.name);
              console.log(`  ✓ Dropped ${collection}.${index.name}`);
            } catch (error) {
              console.log(`  ⚠️  Could not drop ${collection}.${index.name}: ${error.message}`);
            }
          }
        }
      } catch (error) {
        console.log(`  ⚠️  Collection ${collection} not found: ${error.message}`);
      }
    }
    
    console.log('✅ Custom indexes dropped');
  } catch (error) {
    console.error('❌ Error dropping indexes:', error);
    throw error;
  }
};

/**
 * Get index usage statistics (requires MongoDB 4.4+)
 */
const getIndexStats = async () => {
  try {
    const db = mongoose.connection.db;
    
    console.log('📈 Index Usage Statistics:');
    console.log('==========================');
    
    for (const [name, collection] of Object.entries(collections)) {
      try {
        const coll = db.collection(collection);
        const stats = await coll.aggregate([{ $indexStats: {} }]).toArray();
        
        console.log(`\n${name.toUpperCase()}:`);
        stats.forEach(stat => {
          console.log(`  • ${stat.name}: ${stat.accesses.ops} operations`);
        });
      } catch (error) {
        console.log(`  ⚠️  Stats not available for ${collection}: ${error.message}`);
      }
    }
    
    console.log('\n==========================\n');
  } catch (error) {
    console.error('❌ Error getting index stats:', error);
  }
};

module.exports = {
  createPerformanceIndexes,
  dropCustomIndexes,
  getIndexStats,
  printIndexInformation,
  collections,
};

/**
 * Drop legacy unique index on embedded questions.questionId in assessments collection
 * Some deployments created a unique index on questions.questionId which conflicts
 * when assessments are created without pre-populated questions.
 */
async function dropLegacyAssessmentQuestionIdIndex() {
  try {
    const db = mongoose.connection.db;
    const coll = db.collection(collections.assessments);
    const indexes = await coll.listIndexes().toArray();
    const legacy = indexes.find((i) => i.key && i.key['questions.questionId'] === 1);
    if (legacy) {
      try {
        await coll.dropIndex(legacy.name);
        console.log(`🗑️  Dropped legacy index on assessments: ${legacy.name}`);
      } catch (e) {
        console.log(`⚠️  Could not drop legacy index ${legacy.name}: ${e.message}`);
      }
    }
  } catch (e) {
    console.log(`⚠️  Legacy assessment index check failed: ${e.message}`);
  }
}

module.exports.dropLegacyAssessmentQuestionIdIndex = dropLegacyAssessmentQuestionIdIndex;