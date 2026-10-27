import express from 'express';
import {
  uploadDocument,
  getDocuments,
  getDocument,
  downloadDocument,
  deleteDocument,
  searchDocuments,
  moveDocumentToFolder,
} from '../controllers/documentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { handleUpload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/upload', protect, handleUpload('file'), uploadDocument);
router.get('/', protect, getDocuments);
router.get('/search', protect, searchDocuments);
router.get('/:id', protect, getDocument);
router.get('/:id/download', protect, downloadDocument);
router.delete('/:id', protect, deleteDocument);
router.put('/:id/move', protect, moveDocumentToFolder);

export default router;
