# PromptStitch Deployment Guide

This document outlines the steps to deploy PromptStitch to production using Vercel.

## Prerequisites

- A Vercel account
- A Firebase project with Firestore and Authentication enabled
- Firebase project credentials

## Setting Up Environment Variables in Vercel

1. Log in to your Vercel dashboard
2. Create a new project or select your existing PromptStitch project
3. Go to the "Settings" tab and then "Environment Variables"
4. Add the following environment variables from your Firebase project:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

5. Make sure to set these as Production environment variables

## Deploying Firebase Security Rules

1. Install Firebase CLI if you haven't already:
```bash
npm install -g firebase-tools
```

2. Log in to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project (if not already done):
```bash
firebase init
```

4. Deploy the Firestore security rules:
```bash
firebase deploy --only firestore:rules
```

## Deploying to Vercel

1. Connect your GitHub repository to Vercel
2. Configure the build settings:
   - Framework Preset: Vite
   - Build Command: npm run build
   - Output Directory: dist
   - Install Command: npm install

3. Deploy your application
4. Verify that all functionality works correctly in the production environment

## Post-Deployment Verification

After deploying, verify the following functionality:

1. User authentication works correctly
2. Saved prompts can be created, read, updated, and deleted
3. The application loads quickly and efficiently
4. All assets are properly cached
5. Error handling works as expected

## Troubleshooting

If you encounter issues with your deployment:

1. Check that all environment variables are correctly set in Vercel
2. Verify that Firebase security rules are properly deployed
3. Check the Vercel build logs for any errors
4. Test authentication flow in an incognito window
5. Clear browser cache and cookies if testing on a previously used browser

## Monitoring and Analytics

1. Set up Vercel Analytics to monitor performance
2. Configure Firebase Analytics for user behavior tracking
3. Set up error logging with a service like Sentry (optional)