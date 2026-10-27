import express from 'express';
import {
  createFolder,
  getFolders,
  deleteFolder,
} from '../controllers/folderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createFolder)
  .get(protect, getFolders);

router.route('/:id')
  .delete(protect, deleteFolder);

export default router;
