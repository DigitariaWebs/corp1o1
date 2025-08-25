#!/usr/bin/env node
require('dotenv').config();

// Test the AI Service Manager directly
const { aiServiceManager } = require('./services/aiServiceManager');

async function testAIService() {
  console.log('🧪 Testing AI Service Manager...\n');
  
  try {
    // Test 1: Assessment Plan Generation
    console.log('📝 Test 1: Generating Assessment Plan...');
    const plan = await aiServiceManager.generateAssessmentPlan(
      'JavaScript',
      ['React', 'Node.js', 'TypeScript'],
      '2-3 years',
      'become a senior developer',
      'intermediate'
    );
    
    console.log('✅ Assessment Plan Generated:');
    plan.forEach((assessment, index) => {
      console.log(`\n${index + 1}. ${assessment.title}`);
      console.log(`   Description: ${assessment.description}`);
      console.log(`   Skills: ${assessment.targetSkills.join(', ')}`);
      console.log(`   Difficulty: ${assessment.difficulty}`);
      console.log(`   Questions: ${assessment.questionCount}`);
      console.log(`   Duration: ${assessment.estimatedDurationMinutes} minutes`);
    });
    
    // Test 2: Question Generation
    console.log('\n📝 Test 2: Generating Questions...');
    const questions = await aiServiceManager.generateQuestions(
      'JavaScript Fundamentals',
      'Programming',
      'JavaScript Arrays and Objects',
      'intermediate',
      3,
      ['multiple_choice', 'text']
    );
    
    console.log(`✅ Generated ${questions.length} questions`);
    
    // Test 3: AI Personalities
    console.log('\n📝 Test 3: Testing AI Personalities...');
    
    const personalities = ['ARIA', 'SAGE', 'COACH'];
    const testMessage = 'I am struggling with understanding React hooks. Can you help?';
    
    for (const personality of personalities) {
      console.log(`\n🤖 ${personality} Response:`);
      const response = await aiServiceManager.getPersonalityResponse(
        personality,
        testMessage,
        { userName: 'Test User', currentTopic: 'React', performance: 'struggling' }
      );
      console.log(response.message.substring(0, 200) + '...');
    }
    
    // Test 4: Usage Stats
    console.log('\n📊 Usage Statistics:');
    const stats = aiServiceManager.getUsageStats();
    console.log(JSON.stringify(stats, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testAIService();