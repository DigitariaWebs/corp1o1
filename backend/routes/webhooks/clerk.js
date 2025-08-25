const express = require('express');
const { Webhook } = require('svix');
const User = require('../../models/User');

const router = express.Router();

// Webhook endpoint for Clerk user events
router.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    console.log('🔔 Webhook received - Headers:', Object.keys(req.headers));
    console.log('🔔 Content-Type:', req.headers['content-type']);
    console.log('🔔 Body type:', typeof req.body, 'Length:', req.body.length);

    if (!WEBHOOK_SECRET) {
      console.error('❌ CLERK_WEBHOOK_SECRET is not set');
      return res.status(500).json({ 
        success: false, 
        message: 'Webhook secret not configured' 
      });
    }

    // Get headers for verification
    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];

    console.log('🔑 Webhook verification headers:', {
      'svix-id': svix_id ? 'Present' : 'Missing',
      'svix-timestamp': svix_timestamp ? 'Present' : 'Missing',
      'svix-signature': svix_signature ? 'Present' : 'Missing',
    });

    // Verify the webhook signature
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;

    try {
      // Convert buffer to string if needed
      const payload = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);
      
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      console.error('Headers received:', {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature ? 'Present' : 'Missing'
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature',
        error: err.message
      });
    }

    // Handle the webhook event
    const { id, object, type } = evt;
    const eventData = evt.data;

    console.log(`🔔 Received webhook: ${type} for user ${eventData.id}`);

    switch (type) {
      case 'user.created':
        await handleUserCreated(eventData);
        break;
      case 'user.updated':
        await handleUserUpdated(eventData);
        break;
      case 'user.deleted':
        await handleUserDeleted(eventData);
        break;
      default:
        console.log(`ℹ️ Unhandled webhook event type: ${type}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// Handle user created event
async function handleUserCreated(userData) {
  try {
    console.log(`👤 Creating user for Clerk ID: ${userData.id}`);
    
    // Check if user already exists (to prevent duplicates)
    const existingUser = await User.findByClerkId(userData.id);
    if (existingUser) {
      console.log(`⚠️ User already exists for Clerk ID: ${userData.id}`);
      return existingUser;
    }

    // Extract user information from Clerk data
    const firstName = userData.first_name || 'Test';
    const lastName = userData.last_name || 'User';
    
    // For test events, we'll create a test user
    if (!userData.email_addresses || userData.email_addresses.length === 0) {
      console.log(`ℹ️ Test event detected for user: ${userData.id}, creating test user`);
    }

    // Create new user in MongoDB
    const newUser = await User.createFromClerk(userData);
    
    console.log(`✅ User created successfully: ${newUser._id}`);
    return newUser;

  } catch (error) {
    console.error('❌ Error creating user:', error);
    
    // Update sync status to error if user exists
    try {
      const existingUser = await User.findOne({ clerkUserId: userData.id });
      if (existingUser) {
        await User.findOneAndUpdate(
          { clerkUserId: userData.id },
          { 
            clerkSyncStatus: 'error',
            lastClerkSync: new Date() 
          }
        );
      }
    } catch (updateError) {
      console.error('❌ Error updating sync status:', updateError);
    }
    
    // Don't throw error for test events, just log it
    if (!userData.email_addresses || userData.email_addresses.length === 0) {
      console.log(`⚠️ Test event processing completed with warnings`);
      return null;
    }
    
    throw error;
  }
}

// Handle user updated event
async function handleUserUpdated(userData) {
  try {
    console.log(`🔄 Updating user for Clerk ID: ${userData.id}`);
    
    const updatedUser = await User.updateFromClerk(userData);
    
    if (!updatedUser) {
      console.log(`⚠️ User not found for Clerk ID: ${userData.id}, creating new user`);
      return await handleUserCreated(userData);
    }
    
    console.log(`✅ User updated successfully: ${updatedUser._id}`);
    return updatedUser;

  } catch (error) {
    console.error('❌ Error updating user:', error);
    
    // Update sync status to error
    try {
      await User.findOneAndUpdate(
        { clerkUserId: userData.id },
        { 
          clerkSyncStatus: 'error',
          lastClerkSync: new Date() 
        }
      );
    } catch (updateError) {
      console.error('❌ Error updating sync status:', updateError);
    }
    
    throw error;
  }
}

// Handle user deleted event
async function handleUserDeleted(userData) {
  try {
    console.log(`🗑️ Handling user deletion for Clerk ID: ${userData.id}`);
    
    // Soft delete - deactivate the user instead of hard delete
    const deletedUser = await User.findOneAndUpdate(
      { clerkUserId: userData.id },
      { 
        isActive: false,
        clerkSyncStatus: 'synced',
        lastClerkSync: new Date() 
      },
      { new: true }
    );
    
    if (!deletedUser) {
      console.log(`⚠️ User not found for deletion, Clerk ID: ${userData.id}`);
      return null;
    }
    
    console.log(`✅ User soft deleted successfully: ${deletedUser._id}`);
    return deletedUser;

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    throw error;
  }
}

module.exports = router;