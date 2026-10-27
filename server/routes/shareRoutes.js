import express from 'express';
import {
  shareDocument,
  getDocumentShares,
  updateDocumentShare,
  removeDocumentShare,
} from '../controllers/shareController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/documents/:documentId/share', protect, shareDocument);
router.get('/documents/:documentId/shares', protect, getDocumentShares);
router.put('/documents/:documentId/share/:userId', protect, updateDocumentShare);
router.delete('/documents/:documentId/share/:userId', protect, removeDocumentShare);

export default router;
