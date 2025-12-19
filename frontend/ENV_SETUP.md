# Environment Variables Setup

This file explains how to set up the required environment variables for the frontend application.

## Required Environment Variables

Create a `.env.local` file in the `frontend` directory with the following variables:

### Clerk Authentication (Required)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
```

**How to get these:**
1. Go to https://dashboard.clerk.com
2. Create an account or sign in
3. Create a new application
4. Copy the Publishable Key and Secret Key from the API Keys section

### Backend API URL (Required)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Note:** This should match the port your backend server is running on (default is 3001).

### Stream Video (Optional - only needed for video conference features)
```env
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key_here
```

**How to get this:**
1. Go to https://dashboard.getstream.io
2. Create an account or sign in
3. Create a new app
4. Copy the API Key from the dashboard

**Note:** If this is not set, video conference features will be disabled, but the rest of the app will work.

### App URL (Optional - for production)
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Clerk URLs (Optional - defaults work for most cases)
```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

## Quick Setup

1. Copy the template below and create `.env.local` in the `frontend` directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# Stream Video (Optional)
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key_here

# App URL (Optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. Replace the placeholder values with your actual keys
3. Restart your Next.js development server (`npm run dev`)

## Troubleshooting

### Black Screen / Infinite Loading

If you see a black screen with only the snow effect:

1. **Check if Clerk keys are set:**
   - Open browser console (F12)
   - Look for Clerk-related errors
   - Make sure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set

2. **Check if backend is running:**
   - Make sure your backend server is running on port 3001
   - Try accessing `http://localhost:3001/health` in your browser
   - Check the console for API connection errors

3. **Check browser console:**
   - Open DevTools (F12)
   - Look for error messages
   - Check the Network tab for failed requests

### Common Issues

- **"Clerk is not configured"**: Make sure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in `.env.local`
- **"Failed to fetch"**: Check if backend is running and `NEXT_PUBLIC_API_URL` is correct
- **"Stream API key missing"**: This is OK if you don't need video features. The app will work without it.

## Important Notes

- `.env.local` is gitignored and should NOT be committed to version control
- All `NEXT_PUBLIC_*` variables are exposed to the browser
- Restart the Next.js dev server after changing environment variables
- In production, set these variables in your hosting platform's environment settings

