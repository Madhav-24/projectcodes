// Module: Backend App
// Purpose: Compose backend modules and expose the Express application.
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import { sendSuccess } from './utils/apiResponse.js';
import errorHandler from './middlewares/errorHandler.js';
import authMiddleware, { attachProfile } from './middlewares/authMiddleware.js';

// ── Repositories ─────────────────────────────────────────────
import { createPgUserRepository }  from './repositories/pgUserRepository.js';
import { createAlertRepository }   from './repositories/alertRepository.js';
import { createPpeLogRepository }  from './repositories/ppeLogRepository.js';
import { createMessageRepository } from './repositories/messageRepository.js';

// ── Services ─────────────────────────────────────────────────
import { createAuthService }    from './services/authService.js';
import { createAlertService }   from './services/alertService.js';
import { createMessageService } from './services/messageService.js';
import createUserService        from './services/userService.js';

// ── Controllers ──────────────────────────────────────────────
import { createAuthController }    from './controllers/authController.js';
import { createAlertController }   from './controllers/alertController.js';
import { createMessageController } from './controllers/messageController.js';
import createUserController        from './controllers/userController.js';

// ── Routes ───────────────────────────────────────────────────
import createAuthRoutes    from './routes/authRoutes.js';
import createAlertRoutes   from './routes/alertRoutes.js';
import createPpeAlertRoutes from './routes/ppeAlertRoutes.js';
import createMessageRoutes from './routes/messageRoutes.js';
import createUserRoutes    from './routes/userRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Wire up DI graph ─────────────────────────────────────────
const userRepository    = createPgUserRepository();
const alertRepository   = createAlertRepository();
const ppeLogRepository  = createPpeLogRepository();
const messageRepository = createMessageRepository();

const authService    = createAuthService({ userRepository });
const alertService   = createAlertService({ alertRepository, userRepository, ppeLogRepository });
const messageService = createMessageService({ messageRepository });
const userService    = createUserService({ userRepository });

const authController    = createAuthController({ authService });
const alertController   = createAlertController({ alertService });
const messageController = createMessageController({ messageService });
const userController    = createUserController({ userService });

// ── Express app ──────────────────────────────────────────────
const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json({ limit: '2mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Health check
app.get('/api/health', (_req, res) => sendSuccess(res, 'Backend is healthy.'));

// Attach full DB profile to every authenticated request
const profileMiddleware = attachProfile(userRepository);

// ── Route mounting ───────────────────────────────────────────
app.use('/api/auth',     createAuthRoutes({ authController, userRepository }));
app.use('/api/users',    createUserRoutes({ userController, profileMiddleware }));
app.use('/api/alerts/ppe', createPpeAlertRoutes({ alertController }));
// Inject full profile for alert & message handlers that need assignedSite / name
app.use('/api/alerts',   authMiddleware, profileMiddleware, createAlertRoutes({ alertController }));
app.use('/api/messages', authMiddleware, profileMiddleware, createMessageRoutes({ messageController }));

app.use(errorHandler);

// Seed admin user in background after startup
authService.seedAdmin();

export default app;

