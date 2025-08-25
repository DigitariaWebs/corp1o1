# Clerk Webhook Setup Guide

## Overview
This guide will help you configure Clerk webhooks to automatically sync user data between Clerk and MongoDB.

## Step 1: Configure MongoDB Connection

### Option A: MongoDB Atlas (Cloud)
1. **Login to MongoDB Atlas**: https://cloud.mongodb.com
2. **Network Access**: 
   - Go to Network Access in the left sidebar
   - Click "Add IP Address"
   - Either add your current IP or use `0.0.0.0/0` for all IPs (development only)
3. **Update .env file**: Uncomment the Atlas URI in `/backend/.env`
   ```
   MONGODB_URI=mongodb+srv://corp1o1:sokol@cluster0.gojkk4r.mongodb.net/sokol?retryWrites=true&w=majority
   ```

### Option B: Local MongoDB
1. **Install MongoDB locally** or use Docker:
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```
2. **Keep current .env setting**:
   ```
   MONGODB_URI=mongodb://localhost:27017/sokol
   ```

## Step 2: Configure Clerk Dashboard

1. **Login to Clerk Dashboard**: https://dashboard.clerk.com
2. **Navigate to Webhooks**: Go to "Webhooks" in the left sidebar
3. **Create New Endpoint**:
   - Click "Add Endpoint"
   - **Endpoint URL**: 
     - Production: `https://your-domain.com/api/webhooks/clerk`
     - Development (with ngrok): `https://xxxxx.ngrok.io/api/webhooks/clerk`
   - **Events to listen**: Select these events:
     - `user.created`
     - `user.updated`
     - `user.deleted`
4. **Copy the Signing Secret**: 
   - After creating the endpoint, copy the signing secret
   - It will look like: `whsec_xxxxxxxxxxxxxxxxxx`
5. **Update .env file**:
   ```
   CLERK_WEBHOOK_SECRET=whsec_your_actual_secret_here
   ```

## Step 3: Testing with Ngrok (Development)

For local development, you need to expose your local server to the internet:

1. **Install ngrok**: https://ngrok.com/download
2. **Start your backend server**:
   ```bash
   cd backend
   npm run dev
   ```
3. **In another terminal, start ngrok**:
   ```bash
   ngrok http 3001
   ```
4. **Copy the ngrok URL**: It will look like `https://xxxxx.ngrok.io`
5. **Update Clerk webhook endpoint** with the ngrok URL + `/api/webhooks/clerk`

## Step 4: Test the Integration

1. **Create a test user in Clerk**:
   - Go to Clerk Dashboard > Users
   - Click "Create User"
   - Fill in test details

2. **Check MongoDB**:
   - The user should appear in your MongoDB `users` collection
   - Check server logs for webhook activity

3. **Verify Assessment Linkage**:
   - When users take assessments, they'll now be linked via:
     - `userId` (MongoDB ObjectId)
     - `clerkUserId` (Clerk's user ID)

## Step 5: Production Deployment

1. **Update production .env**:
   - Use production MongoDB URI
   - Ensure `CLERK_WEBHOOK_SECRET` is set
   - Update `FRONTEND_URL` and other production settings

2. **Update Clerk webhook endpoint**:
   - Change from ngrok URL to your production domain
   - Example: `https://api.yourdomain.com/api/webhooks/clerk`

## Webhook Event Flow

```
User Signs Up in Clerk
         ↓
Clerk sends webhook to your backend
         ↓
/api/webhooks/clerk endpoint receives event
         ↓
Webhook signature verified using CLERK_WEBHOOK_SECRET
         ↓
User created/updated in MongoDB
         ↓
User can now:
- Take assessments (linked to their profile)
- View their assessment history
- Track progress
- Earn certificates
```

## Troubleshooting

### Webhook not receiving events
- Check ngrok is running (for development)
- Verify endpoint URL in Clerk dashboard
- Check `CLERK_WEBHOOK_SECRET` matches

### User not created in MongoDB
- Check MongoDB connection is working
- Look for errors in server logs
- Verify webhook secret is correct (with `=` sign)

### Assessment not linking to user
- Ensure user exists in MongoDB first
- Check `clerkUserId` field is populated
- Verify authentication middleware is working

## Security Notes

- **Never commit real secrets** to version control
- **Use environment variables** for all sensitive data
- **Verify webhook signatures** (already implemented)
- **Use HTTPS** in production
- **Restrict MongoDB IP access** in production

## Additional Resources

- [Clerk Webhook Documentation](https://clerk.com/docs/webhooks/sync-data)
- [MongoDB Atlas Setup](https://www.mongodb.com/cloud/atlas)
- [Ngrok Documentation](https://ngrok.com/docs)