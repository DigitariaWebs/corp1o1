#!/usr/bin/env node
require('dotenv').config();

// Test complete assessment flow
const axios = require('axios');
const BASE_URL = 'http://localhost:3001/api';

// Test user ID (from your logs)
const TEST_USER_ID = '68a861e4b1a3fad5c31d2b51';

async function testAssessmentFlow() {
  console.log('🧪 Testing Complete Assessment Flow...\n');
  
  try {
    // Step 1: Generate Assessment Plan
    console.log('📝 Step 1: Generating Assessment Plan...');
    const planResponse = await axios.post(`${BASE_URL}/assessments/plan`, {
      primaryDomain: 'Python',
      subdomains: ['Django', 'Flask', 'FastAPI'],
      yearsExperience: '2-3',
      goals: 'become a Python backend expert',
      preferredDifficulty: 'intermediate'
    });
    
    console.log('✅ Plan generated:', planResponse.data.data.plan.map(p => ({
      title: p.title,
      assessmentId: p.assessmentId
    })));
    
    // Step 2: Get Available Assessments
    console.log('\n📝 Step 2: Getting Available Assessments...');
    const assessmentsResponse = await axios.get(`${BASE_URL}/assessments/available?limit=10`);
    console.log(`✅ Found ${assessmentsResponse.data.data.assessments.length} assessments`);
    
    // Find one of our generated assessments
    const generatedAssessment = assessmentsResponse.data.data.assessments.find(a => 
      a.title.includes('Python')
    );
    
    if (generatedAssessment) {
      console.log(`✅ Found generated assessment: ${generatedAssessment.title}`);
      console.log(`   ID: ${generatedAssessment._id}`);
      console.log(`   Questions: ${generatedAssessment.totalQuestions}`);
      
      // Step 3: Start Assessment Session
      console.log('\n📝 Step 3: Starting Assessment Session...');
      try {
        const sessionResponse = await axios.post(
          `${BASE_URL}/assessments/${generatedAssessment._id}/start`,
          {},
          { headers: { 'user-id': TEST_USER_ID } }
        );
        
        console.log('✅ Session started:', {
          sessionId: sessionResponse.data.data.session.sessionId,
          totalQuestions: sessionResponse.data.data.questions.length,
          firstQuestion: sessionResponse.data.data.questions[0]?.question?.substring(0, 50) + '...'
        });
      } catch (sessionError) {
        console.error('❌ Session start failed:', sessionError.response?.data || sessionError.message);
      }
    } else {
      console.log('⚠️ No Python assessment found in available list');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Check if server is running
axios.get(`${BASE_URL}/health`)
  .then(() => {
    console.log('✅ Server is running\n');
    testAssessmentFlow();
  })
  .catch(() => {
    console.error('❌ Server is not running. Please start it with: npm run dev');
  });