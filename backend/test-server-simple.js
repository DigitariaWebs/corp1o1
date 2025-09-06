#!/usr/bin/env node
require('dotenv').config();

console.log('Testing server startup...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('Port:', process.env.PORT || 3001);

// Test database connection
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('\nTesting MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected successfully');
    
    // Test AI service
    console.log('\nTesting AI Service Manager...');
    const { aiServiceManager } = require('./services/aiServiceManager');
    console.log('✅ AI Service Manager loaded');
    console.log('Models:', aiServiceManager.getUsageStats().models.map(m => m.model));
    
    await mongoose.connection.close();
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testConnection();