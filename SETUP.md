# Setup Guide

## Quick Start

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Enable **Realtime Database** (not Firestore):
   - Go to "Build" → "Realtime Database"
   - Click "Create Database"
   - Choose a location
   - Start in **test mode** (we'll update rules next)

### 2. Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app (you can name it "Poker Chip Tracker")
5. Copy the Firebase configuration object

### 3. Update firebase-config.js

Open `firebase-config.js` and replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "AIza...", // Your actual API key
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

### 4. Set Firebase Security Rules

In Firebase Console → Realtime Database → Rules, set:

```json
{
  "rules": {
    "tables": {
      ".read": true,
      ".write": true,
      "$tableId": {
        ".validate": "newData.hasChild('expiresAt') && newData.child('expiresAt').val() > now"
      }
    }
  }
}
```

**Note**: These rules allow anyone to read/write. For production, consider:
- Adding authentication
- Using Firebase Functions to clean up expired tables
- Adding rate limiting

### 5. Deploy to Netlify

#### Option A: Via Netlify Dashboard

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Netlify](https://app.netlify.com/)
3. Click "Add new site" → "Import an existing project"
4. Connect your repository
5. Build settings:
   - Build command: (leave empty)
   - Publish directory: `.` (root)
6. Click "Deploy site"

#### Option B: Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### 6. Test Your Deployment

1. Visit your Netlify URL
2. Create a new table
3. Copy the shareable link
4. Open it in an incognito window to test multiplayer sync

## Troubleshooting

### Tables not syncing?
- Check Firebase console for errors
- Verify your `firebase-config.js` has correct values
- Check browser console for Firebase errors

### Can't create tables?
- Verify Firebase Realtime Database is enabled (not Firestore)
- Check security rules allow writes
- Check browser console for errors

### Tables expiring too quickly?
- Tables expire after 24 hours by default
- You can modify the expiration in `app.js` (line ~242):
  ```javascript
  expiresAt: Date.now() + (24 * 60 * 60 * 1000) // Change 24 to desired hours
  ```

## Firebase Free Tier Limits

The free Spark plan includes:
- 1 GB storage
- 10 GB/month bandwidth
- 100 concurrent connections

This should be sufficient for casual use. For heavy usage, consider the Blaze (pay-as-you-go) plan.
