#!/usr/bin/env node
require('dotenv').config();

// Direct test of OpenAI API to diagnose issues
const { openAIService } = require('./services/openaiService');

async function testOpenAI() {
  console.log('🧪 Testing OpenAI API directly...\n');
  
  try {
    // Test 1: Simple completion without JSON format
    console.log('📝 Test 1: Simple completion...');
    const response1 = await openAIService.createChatCompletion(
      [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello World" and nothing else.' }
      ],
      {
        model: 'gpt-4o-mini',
        temperature: 0.5,
        max_tokens: 10
      }
    );
    
    console.log('✅ Response 1:', response1.content);
    
    // Test 2: Generate JSON without format constraint
    console.log('\n📝 Test 2: Generate JSON without format constraint...');
    const response2 = await openAIService.createChatCompletion(
      [
        { role: 'system', content: 'You are a JSON generator. Always respond with valid JSON.' },
        { role: 'user', content: 'Create a simple JSON object with a greeting field containing "Hello World".' }
      ],
      {
        model: 'gpt-4o-mini',
        temperature: 0.5,
        max_tokens: 50
      }
    );
    
    console.log('✅ Response 2:', response2.content);
    
    // Test 3: Generate assessment JSON without format constraint
    console.log('\n📝 Test 3: Generate assessment without JSON format constraint...');
    const response3 = await openAIService.createChatCompletion(
      [
        { 
          role: 'system', 
          content: 'You are an assessment designer. Create learning assessments.'
        },
        { 
          role: 'user', 
          content: `Create one simple assessment for JavaScript basics. Return as JSON with this structure:
{
  "assessments": [
    {
      "id": "test",
      "title": "JavaScript Test",
      "description": "A basic test",
      "difficulty": "beginner"
    }
  ]
}`
        }
      ],
      {
        model: 'gpt-4o',
        temperature: 0.5,
        max_tokens: 200
      }
    );
    
    console.log('✅ Response 3:', response3.content);
    
    // Test 4: Test with response_format
    console.log('\n📝 Test 4: Test with response_format...');
    const response4 = await openAIService.createChatCompletion(
      [
        { 
          role: 'system', 
          content: 'You are a JSON generator. Return valid JSON.'
        },
        { 
          role: 'user', 
          content: 'Create a JSON object with an assessments array containing one assessment with id, title, and description fields.'
        }
      ],
      {
        model: 'gpt-4o',
        temperature: 0.5,
        max_tokens: 200,
        response_format: { type: "json_object" }
      }
    );
    
    console.log('✅ Response 4:', response4.content);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response details:', error.response);
    }
  }
}

// Run the test
testOpenAI();