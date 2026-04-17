## Firebase Deployment Guide

### Prerequisites
- Firebase account at https://firebase.google.com
- Node.js installed
- Firebase CLI: `npm install -g firebase-tools`

### Project Credentials
Your project has been set up with the following Firebase configuration:
```
projectId: projectdatabase-4491d
authDomain: projectdatabase-4491d.firebaseapp.com
databaseURL: https://projectdatabase-4491d-default-rtdb.firebaseio.com
storageBucket: projectdatabase-4491d.firebasestorage.app
Hosting URL: https://projectdatabase-4491d.web.app
```

### Step 1: Sign In to Firebase
```bash
firebase login
```

### Step 2: Initialize Firebase in Your Project
From the project root directory:
```bash
firebase init
```

When prompted, select:
- ✅ Hosting: Configure Firestore security rules and indexes
- ✅ Functions: Configure a Cloud Functions directory and its files
- Choose the existing project: `projectdatabase-4491d`
- Set public directory to: `dist` (this is Vite's build output)
- Configure single page app routing: `Yes`
- Do not overwrite existing files

### Step 3: Build Your App
```bash
npm run build
```

This generates the `dist` folder with all optimized assets.

### Step 4: Deploy to Firebase Hosting
```bash
firebase deploy
```

### Step 5: Access Your App
After deployment, visit:
```
https://projectdatabase-4491d.web.app
```

### Firestore Security Rules
After deployment, update your Firestore security rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own user document
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid || request.auth.uid == 'admin-fallback';
    }
    
    // Allow admins to read all collections
    match /{document=**} {
      allow read, write: if request.auth.uid == 'admin-fallback';
      allow read: if request.auth != null;
    }
  }
}
```

### Continuous Deployment
For automatic deployments:
```bash
# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# View deployment logs
firebase log
```

### Local Development
```bash
npm run dev
# App runs at http://localhost:5173
```

### Troubleshooting
- **Port already in use**: Change `server.port` in `vite.config.js`
- **Firebase not initialized**: Run `firebase init` again
- **Build fails**: Ensure all dependencies are installed with `npm install`
- **Deployment errors**: Check Firebase project permissions and billing

For more details, visit: https://firebase.google.com/docs/hosting
