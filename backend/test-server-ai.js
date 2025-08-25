#!/usr/bin/env node
require('dotenv').config();

// Test server AI endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testAIEndpoints() {
  console.log('🧪 Testing AI-powered endpoints...\n');
  
  try {
    // Test 1: Generate Assessment Plan
    console.log('📝 Test 1: Generate Assessment Plan...');
    const planResponse = await axios.post(`${BASE_URL}/assessments/generate-plan`, {
      domain: 'Python',
      subdomains: ['Django', 'Flask', 'Data Science'],
      experience: '1-2 years',
      goals: 'become a Python backend developer',
      difficulty: 'intermediate'
    });
    
    console.log('✅ Assessment Plan:', JSON.stringify(planResponse.data, null, 2));
    
    // Test 2: Generate Questions  
    console.log('\n📝 Test 2: Generate Questions...');
    const questionsResponse = await axios.post(`${BASE_URL}/questions/generate`, {
      assessmentId: 'test_123',
      title: 'Python Web Development',
      category: 'Programming',
      topic: 'Django REST Framework',
      difficulty: 'intermediate',
      questionCount: 3,
      includeTypes: ['multiple_choice', 'text']
    });
    
    console.log('✅ Questions:', JSON.stringify(questionsResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Check if server is running first
axios.get(`${BASE_URL}/health`)
  .then(() => {
    console.log('✅ Server is running\n');
    testAIEndpoints();
  })
  .catch(() => {
    console.error('❌ Server is not running. Please start it with: npm run dev');
  });