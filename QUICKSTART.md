## Construction AI Monitoring - Quick Start Guide

### Admin Credentials (Pre-configured)
```
Name: Madhav
Email: admin@gmail.com
Password: Admin@1234
Role: Admin (Full Access)
```

These credentials are automatically stored in Firestore and available on first login.

---

## 🚀 Getting Started

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Run Development Server**
```bash
npm run dev
```
App runs at: `http://localhost:5173`

### 3. **Login with Admin Credentials**
- Email: `admin@gmail.com`
- Password: `Admin@1234`

### 4. **Explore Admin Dashboard**
Access all features:
- Dashboard (Site KPIs & Metrics)
- Camera (Live Streams)
- Alerts (AI Safety Warnings)
- Reports (Generate & Export PDFs)
- Messages (Team Communication)
- Site Allocation (Engineer Assignment)
- Settings (Create Users)

---

## 🔧 Firebase Setup

### Project Credentials
```
Project ID: projectdatabase-4491d
Auth Domain: projectdatabase-4491d.firebaseapp.com
Database URL: https://projectdatabase-4491d-default-rtdb.firebaseio.com
Storage Bucket: projectdatabase-4491d.firebasestorage.app
Hosting: https://projectdatabase-4491d.web.app
```

### Initialize Firestore Collections
See `FIRESTORE_SETUP.md` for:
- Collection schemas
- Sample documents
- Security rules setup

---

## 📦 Build & Deploy

### Build for Production
```bash
npm run build
```
Output: `dist/` folder

### Deploy to Firebase Hosting
```bash
firebase login
firebase deploy
```

See `DEPLOYMENT.md` for detailed instructions.

---

## 📱 Features by Role

### **Admin** (Madhav)
- Monitor all sites in real-time
- View AI-generated safety alerts
- Generate detailed PDF reports
- Manage team communication
- Create supervisor & engineer accounts
- Allocate engineers to sites
- View live camera feeds

### **Supervisor**
- View assigned site dashboard
- Review safety alerts
- Access site reports
- Chat with admin & engineers

### **Engineer**
- Edit assigned site metrics
- View live camera feed
- Check safety alerts
- Communicate with team

---

## 🔐 Authentication Flow

1. User enters credentials on login page
2. Firebase Authentication validates credentials
3. User profile loaded from Firestore
4. Role-based routes redirect to appropriate dashboard
5. Real-time updates via Firestore snapshots

### Admin Fallback
The system includes a fallback admin account that works without Firebase Authentication:
- Email: `admin@gmail.com`
- Password: `Admin@1234`
- Auto-created in Firestore on first load

---

## 🗄️ Database Structure

### Collections
- **users** - All user accounts (admin, supervisor, engineer)
- **sites** - Construction site information
- **dashboardData** - Real-time site metrics & progress
- **alerts** - AI-generated safety warnings
- **messages** - Team communication
- **reports** - Generated site reports

See `FIRESTORE_SETUP.md` for detailed schemas.

---

## 📊 Key Pages

| Page | Route | Role | Function |
|------|-------|------|----------|
| Login | `/login` | All | Sign in with credentials |
| Admin Dashboard | `/admin/dashboard` | Admin | Monitor all sites |
| Camera | `/admin/camera` | Admin | View live streams |
| Alerts | `/admin/alerts` | Admin | Review safety alerts |
| Reports | `/admin/reports` | Admin | Generate & export PDFs |
| Messages | `/admin/messages` | Admin | Team communication |
| Site Allocation | `/admin/sites` | Admin | Assign engineers |
| Settings | `/admin/settings` | Admin | Create users |
| Supervisor Dashboard | `/supervisor/dashboard` | Supervisor | View assigned site |
| Engineer Dashboard | `/engineer/dashboard` | Engineer | Edit site metrics |

---

## 🛠️ Development

### Available Scripts
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Check code quality
npm run format     # Format code with Prettier
```

### Technology Stack
- React 18.3.1
- Vite 5.4.1
- Tailwind CSS 3.4.4
- Firebase 11.10.0
- React Router DOM 6.18.0
- Recharts 2.9.0
- React Leaflet 4.2.1
- React Hook Form 7.57.1
- jsPDF & html2canvas (PDF Export)

---

## 🔗 Useful Links

- Firebase Console: https://console.firebase.google.com
- Firestore Docs: https://firebase.google.com/docs/firestore
- React Docs: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- Vite Docs: https://vitejs.dev

---

## ❓ Troubleshooting

### App won't start
```bash
# Clear node_modules and reinstall
rm -r node_modules package-lock.json
npm install
npm run dev
```

### Firebase errors
- Verify credentials in `src/firebase/firebaseConfig.js`
- Check Firestore security rules in Firebase Console
- Ensure Firestore collections exist (see `FIRESTORE_SETUP.md`)

### Build issues
```bash
npm cache clean --force
npm install
npm run build
```

---

## 📞 Support
For Firebase issues, visit: https://firebase.google.com/support

Admin credentials and Firestore setup are ready. Start the app and login to explore!
