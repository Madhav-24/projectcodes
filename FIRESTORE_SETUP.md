## Firestore Database Structure Setup

This document outlines how to initialize collections and documents in Firestore for the Construction AI Monitoring platform.

### Admin User (Auto-Initialized)
The system automatically creates the admin user on first login:
```json
{
  "uid": "admin-fallback",
  "name": "Madhav",
  "email": "admin@gmail.com",
  "password": "Admin@1234",
  "role": "admin",
  "assignedSite": "All Sites",
  "createdAt": "2026-04-11T...",
  "updatedAt": "2026-04-11T...",
  "status": "active"
}
```

### Collections to Create in Firestore

#### 1. `users` Collection
Store all user data (admin, supervisor, engineer)

Example document (Collection: `users`, Document ID: `{uid}`):
```json
{
  "uid": "user-001",
  "name": "John Supervisor",
  "email": "john@company.com",
  "password": "HashedPassword123",
  "role": "supervisor",
  "assignedSite": "Site 1",
  "createdAt": "2026-04-11T10:00:00Z",
  "updatedAt": "2026-04-11T10:00:00Z",
  "status": "active"
}
```

#### 2. `sites` Collection
Store construction site information

Example document (Collection: `sites`, Document ID: `site-001`):
```json
{
  "siteId": "site-001",
  "siteName": "Highway Project - Phase 1",
  "workType": "Highway Work",
  "location": {
    "lat": 28.7041,
    "lng": 77.1025,
    "address": "New Delhi, India"
  },
  "assignedEngineer": "John Engineer",
  "cameraStatus": "Online",
  "createdAt": "2026-04-11T10:00:00Z",
  "status": "Active"
}
```

#### 3. `dashboardData` Collection
Store real-time site progress and metrics

Example document (Collection: `dashboardData`, Document ID: `site-001`):
```json
{
  "siteId": "site-001",
  "workers": 45,
  "progress": 65,
  "materialsUsed": 1200,
  "issues": ["No Helmet - 3 incidents", "Unsafe Zone - 2 incidents"],
  "status": "Active",
  "remarks": [
    {
      "id": "remark-001",
      "comment": "Girder installation completed ahead of schedule",
      "author": "John Engineer",
      "timestamp": "2026-04-11 14:30"
    }
  ],
  "chartData": [
    { "name": "Week 1", "progress": 20 },
    { "name": "Week 2", "progress": 40 },
    { "name": "Week 3", "progress": 65 }
  ],
  "materialData": [
    { "name": "Concrete", "value": 500 },
    { "name": "Steel", "value": 400 },
    { "name": "Other", "value": 300 }
  ],
  "materialUsed": 1200,
  "assignedEngineer": "John Engineer",
  "updatedAt": "2026-04-11T14:30:00Z"
}
```

#### 4. `alerts` Collection
Store AI-generated safety alerts

Example document (Collection: `alerts`, Document ID: `alert-001`):
```json
{
  "alertId": "alert-001",
  "siteId": "site-001",
  "title": "Worker Without Helmet Detected",
  "description": "AI detected a worker not wearing safety helmet in Zone B",
  "severity": "Critical",
  "status": "Active",
  "timestamp": "2026-04-11T14:30:00Z",
  "resolvedAt": null,
  "resolvedBy": null
}
```

#### 5. `messages` Collection
Store chat messages between users

Example document (Collection: `messages`, Document ID: `msg-001`):
```json
{
  "messageId": "msg-001",
  "senderId": "user-001",
  "senderName": "John Engineer",
  "receiverId": "admin-fallback",
  "text": "Alert at Site 1: 3 workers without helmets",
  "timestamp": {
    "_seconds": 1712846400,
    "_nanoseconds": 0
  },
  "read": false,
  "type": "alert"
}
```

#### 6. `reports` Collection
Store generated site reports

Example document (Collection: `reports`, Document ID: `report-001`):
```json
{
  "reportId": "report-001",
  "siteId": "site-001",
  "progress": 65,
  "workers": 45,
  "issues": 2,
  "summary": "Site progress on track. Minor safety incident resolved.",
  "createdAt": "2026-04-11T10:00:00Z",
  "createdBy": "Madhav"
}
```

### How to Add Documents to Firestore

#### Via Firebase Console
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `projectdatabase-4491d`
3. Go to **Firestore Database**
4. Create a new collection or document
5. Copy-paste the JSON examples above

#### Via Code (Recommended)
Create a setup script `src/utils/firebaseInit.js`:
```javascript
import { collection, addDoc, getFirestore } from 'firebase/firestore';
import app from '../firebase/firebaseConfig.js';

const db = getFirestore(app);

export async function seedFirestore() {
  try {
    // Add sites
    await addDoc(collection(db, 'sites'), {
      siteId: 'site-001',
      siteName: 'Highway Project - Phase 1',
      workType: 'Highway Work',
      location: { lat: 28.7041, lng: 77.1025 },
      assignedEngineer: 'John Engineer',
      status: 'Active'
    });

    // Add dashboard data
    await addDoc(collection(db, 'dashboardData'), {
      siteId: 'site-001',
      workers: 45,
      progress: 65,
      status: 'Active'
    });

    console.log('Firestore seeded successfully!');
  } catch (error) {
    console.error('Error seeding Firestore:', error);
  }
}
```

### Firestore Rules
Apply these security rules in Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin access to all collections
    match /{document=**} {
      allow read, write: if request.auth.uid == 'admin-fallback';
    }
    
    // Users can read their own data
    match /users/{uid} {
      allow read: if request.auth.uid == uid;
      allow write: if request.auth.uid == 'admin-fallback';
    }
    
    // All authenticated users can read sites and dashboardData
    match /sites/{document=**} {
      allow read: if request.auth != null;
    }
    
    match /dashboardData/{document=**} {
      allow read: if request.auth != null;
    }
    
    // Alerts can be read by any authenticated user
    match /alerts/{document=**} {
      allow read: if request.auth != null;
    }
    
    // Messages - users can read their own
    match /messages/{document=**} {
      allow read: if request.auth.uid == resource.data.senderId || request.auth.uid == resource.data.receiverId;
      allow write: if request.auth != null;
    }
  }
}
```

### Next Steps
1. Go to Firebase Console
2. Create the collections above
3. Add sample documents
4. Update Firestore security rules
5. Deploy your app: `firebase deploy`
