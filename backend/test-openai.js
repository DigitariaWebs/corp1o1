#!/usr/bin/env node

require('dotenv').config();
const openaiService = require('./services/openaiService');

async function testOpenAI() {
  try {
    console.log('Testing OpenAI connection...');
    console.log('API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('API Key length:', process.env.OPENAI_API_KEY?.length);
    
    const completion = await openaiService.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello, OpenAI is working!" in JSON format with a "message" field.' }
      ],
      temperature: 0.5,
      max_tokens: 50
    });
    
    console.log('✅ OpenAI Response:', completion.choices?.[0]?.message?.content);
  } catch (error) {
    console.error('❌ OpenAI Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testOpenAI();