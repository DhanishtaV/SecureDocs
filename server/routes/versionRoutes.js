import express from 'express';
import {
  uploadNewVersion,
  getVersionHistory,
  downloadVersion,
  restoreVersion,
} from '../controllers/versionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { handleUpload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/documents/:id/versions', protect, handleUpload('file'), uploadNewVersion);
router.get('/documents/:id/versions', protect, getVersionHistory);
router.get('/documents/:id/versions/:versionNumber/download', protect, downloadVersion);
router.post('/documents/:id/versions/:versionNumber/restore', protect, restoreVersion);

export default router;
