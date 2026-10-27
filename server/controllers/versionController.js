import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import Document from '../models/Document.js';
import DocumentVersion from '../models/DocumentVersion.js';
import DocumentShare from '../models/DocumentShare.js';
import { encryptFile, decryptFile } from '../utils/fileEncryption.js';

/**
 * Helper to determine user role on a document ('owner', 'editor', 'viewer', or null)
 */
const getDocumentUserRole = async (document, userId) => {
  if (document.owner.toString() === userId.toString()) {
    return 'owner';
  }
  const share = await DocumentShare.findOne({ document: document._id, user: userId });
  if (share) {
    return share.role; // 'editor' or 'viewer'
  }
  return null;
};

/**
 * @desc    Upload a new version of a document
 * @route   POST /api/documents/:id/versions
 * @access  Private (Owner & Editor only)
 */
export const uploadNewVersion = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Invalid document ID' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file for the new version' });
    }

    const document = await Document.findById(id);

    if (!document) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permission: Owner or Editor only
    const role = await getDocumentUserRole(document, req.user._id);

    if (!role || role === 'viewer') {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'You do not have permission to upload new versions' });
    }

    const nextVersionNumber = document.currentVersion + 1;
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    const encryptedFilename = `enc-v${nextVersionNumber}-${Date.now()}-${Math.round(Math.random() * 1e9)}.enc`;
    const encryptedPath = path.join(uploadsDir, encryptedFilename);

    // Encrypt file at rest
    await encryptFile(req.file.path, encryptedPath);
    const relativeEncryptedPath = path.join('uploads', encryptedFilename);

    // Create DocumentVersion entry
    const newVersion = await DocumentVersion.create({
      document: document._id,
      versionNumber: nextVersionNumber,
      filePath: relativeEncryptedPath,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user._id,
    });

    // Update main Document metadata
    document.currentVersion = nextVersionNumber;
    document.filePath = relativeEncryptedPath;
    document.originalName = req.file.originalname;
    document.mimeType = req.file.mimetype;
    document.fileSize = req.file.size;
    if (req.body.name && req.body.name.trim() !== '') {
      document.name = req.body.name.trim();
    }
    await document.save();

    res.status(201).json({
      message: 'New version uploaded successfully',
      version: {
        versionNumber: newVersion.versionNumber,
        originalName: newVersion.originalName,
        fileSize: newVersion.fileSize,
        uploadedBy: newVersion.uploadedBy,
        createdAt: newVersion.createdAt,
      },
      currentVersion: nextVersionNumber,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    next(error);
  }
};

/**
 * @desc    Get version history for a document
 * @route   GET /api/documents/:id/versions
 * @access  Private (Owner, Editor, Viewer)
 */
export const getVersionHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const role = await getDocumentUserRole(document, req.user._id);

    if (!role) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }

    const versions = await DocumentVersion.find({ document: id })
      .populate('uploadedBy', 'name email')
      .sort({ versionNumber: -1 });

    const formattedVersions = versions.map((v) => ({
      versionNumber: v.versionNumber,
      originalName: v.originalName,
      fileSize: v.fileSize,
      uploadedBy: {
        name: v.uploadedBy ? v.uploadedBy.name : 'Unknown',
        email: v.uploadedBy ? v.uploadedBy.email : '',
      },
      createdAt: v.createdAt,
    }));

    res.status(200).json({
      documentId: document._id,
      currentVersion: document.currentVersion,
      versions: formattedVersions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download a specific version of a document
 * @route   GET /api/documents/:id/versions/:versionNumber/download
 * @access  Private (Owner, Editor, Viewer)
 */
export const downloadVersion = async (req, res, next) => {
  let tempDecryptedPath = null;
  try {
    const { id, versionNumber } = req.params;
    const vNum = parseInt(versionNumber, 10);

    if (!mongoose.Types.ObjectId.isValid(id) || isNaN(vNum)) {
      return res.status(400).json({ message: 'Invalid document ID or version number' });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const role = await getDocumentUserRole(document, req.user._id);

    if (!role) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }

    const versionDoc = await DocumentVersion.findOne({ document: id, versionNumber: vNum });

    if (!versionDoc) {
      return res.status(404).json({ message: `Version ${vNum} not found` });
    }

    const encryptedPath = path.resolve(process.cwd(), versionDoc.filePath);

    if (!fs.existsSync(encryptedPath)) {
      return res.status(404).json({ message: 'Encrypted version file not found on server' });
    }

    // Generate temporary path for decrypted file
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    tempDecryptedPath = path.join(uploadsDir, `temp-dec-${Date.now()}-${Math.round(Math.random() * 1e9)}.tmp`);

    await decryptFile(encryptedPath, tempDecryptedPath);

    res.download(tempDecryptedPath, versionDoc.originalName, (err) => {
      if (tempDecryptedPath && fs.existsSync(tempDecryptedPath)) {
        try { fs.unlinkSync(tempDecryptedPath); } catch (_) {}
      }
      if (err && !res.headersSent) {
        return res.status(500).json({ message: 'Failed to download version file' });
      }
    });
  } catch (error) {
    if (tempDecryptedPath && fs.existsSync(tempDecryptedPath)) {
      try { fs.unlinkSync(tempDecryptedPath); } catch (_) {}
    }
    next(error);
  }
};

/**
 * @desc    Restore a previous version of a document
 * @route   POST /api/documents/:id/versions/:versionNumber/restore
 * @access  Private (Owner & Editor only)
 */
export const restoreVersion = async (req, res, next) => {
  try {
    const { id, versionNumber } = req.params;
    const vNum = parseInt(versionNumber, 10);

    if (!mongoose.Types.ObjectId.isValid(id) || isNaN(vNum)) {
      return res.status(400).json({ message: 'Invalid document ID or version number' });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const role = await getDocumentUserRole(document, req.user._id);

    if (!role || role === 'viewer') {
      return res.status(403).json({ message: 'You do not have permission to restore document versions' });
    }

    const targetVersion = await DocumentVersion.findOne({ document: id, versionNumber: vNum });

    if (!targetVersion) {
      return res.status(404).json({ message: `Version ${vNum} not found` });
    }

    const nextVersionNumber = document.currentVersion + 1;

    // Create a NEW DocumentVersion entry representing the restore (reusing encrypted file)
    const restoredVersion = await DocumentVersion.create({
      document: document._id,
      versionNumber: nextVersionNumber,
      filePath: targetVersion.filePath,
      originalName: targetVersion.originalName,
      mimeType: targetVersion.mimeType,
      fileSize: targetVersion.fileSize,
      uploadedBy: req.user._id,
    });

    // Update main Document metadata
    document.currentVersion = nextVersionNumber;
    document.filePath = targetVersion.filePath;
    document.originalName = targetVersion.originalName;
    document.mimeType = targetVersion.mimeType;
    document.fileSize = targetVersion.fileSize;
    await document.save();

    res.status(200).json({
      message: `Version ${vNum} restored successfully as Version ${nextVersionNumber}`,
      currentVersion: nextVersionNumber,
      restoredVersion: {
        versionNumber: restoredVersion.versionNumber,
        originalName: restoredVersion.originalName,
        fileSize: restoredVersion.fileSize,
      },
    });
  } catch (error) {
    next(error);
  }
};
