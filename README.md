# Construction Site Management System

## Overview
This is a comprehensive web-based Construction Site Management System built with React and Firebase. The application provides role-based access control for different stakeholders in construction projects, including administrators, project managers, engineers, and supervisors. It features real-time dashboards, site monitoring, safety compliance tracking, and communication tools.

## Features

### Role-Based Access Control
- **Admin**: Full system access, user management, site allocation, reports
- **Project Manager**: Project oversight, budget tracking, team coordination
- **Engineer**: Technical monitoring, equipment tracking, compliance reports
- **Supervisor**: On-site supervision, worker management, safety monitoring

### Core Functionality
- **Real-time Dashboards**: KPI cards, charts, and metrics for each role
- **Site Mapping**: Interactive maps for site locations and progress tracking
- **Safety & Compliance**: PPE compliance tracking, safety leaderboards, alerts
- **Communication**: In-app messaging system for team coordination
- **Camera Integration**: Live camera feeds for site monitoring
- **Reports & Analytics**: Comprehensive reporting tools with charts and data visualization
- **AI Predictive Analytics**: Predictive insights for project management

### Technical Features
- Responsive design with Tailwind CSS
- Firebase authentication and Firestore database
- Real-time data synchronization
- Progressive Web App capabilities
- Secure role-based permissions

## Technology Stack
- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS, PostCSS
- **Backend**: Firebase (Authentication, Firestore)
- **Charts**: Custom chart components
- **Maps**: Interactive mapping components
- **Build Tool**: Vite

## Installation

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn
- Firebase project setup

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd construction-site-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication and Firestore
   - Copy your Firebase config to `src/firebase/firebaseConfig.js`

4. **Environment Setup**
   - Update Firebase configuration in `src/firebase/firebaseConfig.js`
   - Configure Firestore security rules as outlined in `FIRESTORE_SETUP.md`

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

## Usage

### User Roles and Permissions
- **Login**: Users authenticate with email/password
- **Role Assignment**: Administrators assign roles during user creation
- **Dashboard Access**: Each role has a customized dashboard with relevant metrics and tools

### Key Workflows
1. **Site Setup**: Admins allocate sites and assign team members
2. **Daily Operations**: Supervisors monitor on-site activities and safety compliance
3. **Progress Tracking**: Project managers review budgets, timelines, and KPIs
4. **Reporting**: Engineers generate technical reports and compliance documentation
5. **Communication**: All users can send messages and receive alerts

## Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── cards/          # KPI and metric cards
│   ├── charts/         # Data visualization components
│   ├── common/         # Shared components (alerts, spinners, etc.)
│   ├── forms/          # Form components
│   ├── layout/         # Layout components (sidebar, header)
│   ├── maps/           # Map components
│   └── modals/         # Modal dialogs
├── constants/          # Application constants (roles, etc.)
├── context/            # React context providers
├── firebase/           # Firebase configuration
├── hooks/              # Custom React hooks
├── pages/              # Page components by role
│   ├── admin/          # Admin-specific pages
│   ├── auth/           # Authentication pages
│   ├── engineer/       # Engineer pages
│   ├── project-manager/# Project manager pages
│   └── supervisor/     # Supervisor pages
├── routes/             # Routing configuration
└── services/           # API and service functions
```

## Deployment
For detailed deployment instructions, refer to `DEPLOYMENT.md`.

## Quick Start
For a quick setup guide, see `QUICK_START.md`.

## Authentication & Permissions
For detailed information about user authentication and permission management, refer to `AUTHENTICATION_PERMISSIONS_GUIDE.md`.

## Firestore Setup
Database setup and security rules are documented in `FIRESTORE_SETUP.md`.

## Support
For technical support or questions about the application, please contact the development team.

## License
This project is proprietary software. All rights reserved.