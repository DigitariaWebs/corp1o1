#!/usr/bin/env node

/**
 * Test script for Clerk webhook
 * Simulates a user.created event from Clerk
 */

const { Webhook } = require('svix');
const axios = require('axios');

// Webhook secret from .env
const WEBHOOK_SECRET = 'whsec_WFuRKbzy//o2drx5xwlPW6VyZnDtb2qh';

// Test user data (simulating Clerk user.created event)
const testPayload = {
  data: {
    id: 'user_test_' + Date.now(),
    first_name: 'Test',
    last_name: 'User',
    email_addresses: [
      {
        email_address: `test.user.${Date.now()}@example.com`,
        verification: {
          status: 'verified'
        }
      }
    ],
    profile_image_url: 'https://example.com/avatar.jpg',
    created_at: Date.now(),
    updated_at: Date.now()
  },
  object: 'event',
  type: 'user.created'
};

async function testWebhook() {
  try {
    console.log('🧪 Testing Clerk webhook...');
    
    // Create webhook instance for signing
    const wh = new Webhook(WEBHOOK_SECRET);
    
    // Generate headers
    const payload = JSON.stringify(testPayload);
    const headers = wh.sign(payload);
    
    console.log('📦 Sending test user creation event...');
    console.log('User ID:', testPayload.data.id);
    console.log('Email:', testPayload.data.email_addresses[0].email_address);
    
    // Send request to webhook endpoint
    const response = await axios.post(
      'http://localhost:3001/api/webhooks/clerk',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'svix-id': headers['svix-id'],
          'svix-timestamp': headers['svix-timestamp'],
          'svix-signature': headers['svix-signature']
        }
      }
    );
    
    console.log('✅ Webhook response:', response.data);
    console.log('\n📊 Check MongoDB to verify user was created:');
    console.log('Run: mongosh sokol --eval "db.users.findOne({clerkUserId: \'' + testPayload.data.id + '\'})"');
    
  } catch (error) {
    console.error('❌ Error testing webhook:', error.response?.data || error.message);
    if (error.response?.status === 400) {
      console.log('💡 Tip: Check that CLERK_WEBHOOK_SECRET in .env matches the test script');
    }
  }
}

// Run the test
testWebhook();