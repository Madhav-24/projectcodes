# Construction AI Monitoring

## Description
Construction AI Monitoring is a full-stack role-based platform for site operations, safety alerting, and team communication.

The project includes:
- A React frontend with dashboards for Admin, Supervisor, Engineer, and Project Manager roles
- A Node.js/Express REST backend with PostgreSQL persistence for users, alerts, and messages
- A Python FastAPI PPE engine that streams camera frames over WebSocket and posts PPE violation events to the backend

## Features
- Role-based authentication and route protection
- JWT auth with secure password hashing (Argon2)
- User management and permission updates
- Alert management and PPE violation ingestion endpoint
- PPE violation logging to PostgreSQL server logs through a database function (`log_ppe_alert`)
- In-app messaging with file attachments (up to 5 files, 10 MB each)
- Live camera WebSocket streaming integration in UI
- Uploads served as static assets from `/uploads`
- Tailwind-based responsive frontend with charts/maps components

## Tech Stack

### Frontend
- React 18
- Vite 5
- React Router 6
- Tailwind CSS 3
- Recharts
- React Leaflet / Leaflet
- React Toastify

### Backend API
- Node.js (ES modules)
- Express 4
- PostgreSQL (`pg`)
- JWT (`jsonwebtoken`)
- Argon2
- Multer (attachments upload)
- Helmet + CORS + Dotenv

### PPE Engine (Python)
- FastAPI
- Uvicorn
- OpenCV
- WebSockets
- Ultralytics/Torch (for model inference path)

## Architecture
- Frontend (`src`) calls REST API (`/api/*`) via `src/api/client.js`
- Express app is composed using repositories -> services -> controllers -> routes
- PPE engine exposes `/ws/camera` and streams frames/events
- PPE engine sends deduplicated PPE violations to backend `POST /api/alerts/ppe`
- Backend logs PPE events using PostgreSQL `RAISE LOG` function (`log_ppe_alert`)

## Project Structure
```text
.
├── src/                        # React frontend
│   ├── api/                    # Fetch wrapper and upload helper
│   ├── components/             # UI modules
│   ├── context/                # Auth, Theme, Alert contexts
│   ├── pages/                  # Role-specific pages
│   ├── routes/                 # Protected and role-based routing
│   └── services/               # WebSocket and utility services
├── backend/
│   ├── app.js                  # Express app composition
│   ├── server.js               # Express entrypoint
│   ├── routes/                 # REST routes
│   ├── controllers/            # HTTP + PPE websocket controllers
│   ├── services/               # Business logic
│   ├── repositories/           # PostgreSQL data access
│   ├── db/
│   │   ├── schema.sql          # Base schema
│   │   └── migrations/         # SQL migrations
│   └── ppe_engine/main.py      # FastAPI PPE engine entrypoint
├── uploads/                    # Stored message attachments
├── .env.example                # Environment template
└── package.json                # Node scripts/dependencies
```

## Installation

### Prerequisites
- Node.js 18+ recommended
- npm
- PostgreSQL 14+ recommended
- Python 3.10+ (for PPE engine)

### 1) Install Node dependencies
```bash
npm install
```

### 2) Configure environment
Copy `.env.example` to `.env` and fill real values:
```bash
cp .env.example .env
```

### 3) Initialize database schema
From project root:
```bash
psql "$DATABASE_URL" -f backend/db/schema.sql
```

Apply migration for PPE log-only mode:
```bash
psql "$DATABASE_URL" -f backend/db/migrations/2026-04-29-ppe-log-only.sql
```

### 4) (Optional) Install PPE engine Python dependencies
```bash
pip install -r "backend/ppe_safety_app 1/ppe_safety_app/requirements_fastapi.txt"
```

## Usage

### Start frontend + backend together
```bash
npm run dev:full
```

### Start only frontend
```bash
npm run dev
```

### Start only backend (Express)
```bash
npm run dev:backend
```

### Start PPE engine (FastAPI)
```bash
uvicorn backend.ppe_engine.main:app --host 0.0.0.0 --port 8000 --reload
```

### Default local URLs
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`
- PPE engine: `http://localhost:8000`

## Configuration

Environment variables come from `.env`.

### Frontend
- `VITE_API_URL` (optional): backend base URL in production
- `VITE_PPE_WS_URL`: PPE camera websocket URL (default local expected `ws://localhost:8000/ws/camera`)

### Backend (Express)
- `PORT`: backend port (default `4000`)
- `CLIENT_ORIGIN`: CORS allowlist origin
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: token TTL (default `7d`)
- `ARGON2_MEMORY_COST`, `ARGON2_TIME_COST`, `ARGON2_PARALLELISM`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SYNC_ON_STARTUP`
- `PPE_INGEST_KEY`: shared key for machine-to-machine PPE ingest auth
- `PPE_ALERT_API_URL`, `PPE_ALERT_SITE`

### PPE Engine
- `PPE_CAMERA_SOURCE`: webcam index (`0`, `1`, `2`) or RTSP URL

## Scripts
Defined in `package.json`:

- `npm run dev` - start Vite frontend
- `npm run dev:backend` - start Express backend
- `npm run dev:full` - run frontend + backend concurrently
- `npm run build` - production frontend build
- `npm run preview` - preview built frontend
- `npm run lint` - run ESLint
- `npm run format` - run Prettier

## API Documentation

### Response envelope
Successful API responses are returned in the form:
```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

### Health
- `GET /api/health`

### Auth
- `POST /api/auth/login` (body: `identifier`, `password`)
- `POST /api/auth/register` (body: `name`, `email`, `password`, `role`, optional profile fields)
- `GET /api/auth/me` (requires bearer token)
- `POST /api/auth/change-password` (requires bearer token)

### Users
- `GET /api/users`
- `GET /api/users/:userId`
- `PATCH /api/users/:userId/permissions`

### Alerts
- `GET /api/alerts`
- `POST /api/alerts`
- `POST /api/alerts/ppe` (protected by PPE ingest key middleware)

### Messages
- `GET /api/messages`
- `POST /api/messages` (`multipart/form-data`, field `files[]` up to 5)

### Uploads
- Static files served from `GET /uploads/<filename>`

### PPE Engine
- `GET /health`
- `WS /ws/camera`

## Screenshots / Examples
No screenshots are currently included in the repository.

## Contributing
No formal contribution guideline file is present. If you plan to contribute, open an issue/PR with a clear scope and reproduction steps.

## Additional Docs
- `AUTHENTICATION_PERMISSIONS_GUIDE.md`
- `DEPLOYMENT.md`
- `FIRESTORE_SETUP.md` (legacy doc; verify applicability against current PostgreSQL backend)

## License
No standalone `LICENSE` file is present in this repository. The previous project note indicates proprietary usage.