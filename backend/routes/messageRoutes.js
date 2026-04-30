// Module: Message Routes
// Purpose: Map messaging endpoints to controller handlers (supports file attachments via multer).
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import asyncHandler from '../middlewares/asyncHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (_req, file, cb) => {
    const allowed = /image|pdf|video|audio|text|application/;
    cb(null, allowed.test(file.mimetype));
  },
});

export default function createMessageRoutes({ messageController }) {
  const router = Router();

  router.get('/', asyncHandler(messageController.getMessages));

  router.post('/',
    upload.array('files', 5),
    asyncHandler(messageController.sendMessage),
  );

  return router;
}
