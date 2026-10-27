import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import Document from '../models/Document.js';
import Folder from '../models/Folder.js';
import DocumentShare from '../models/DocumentShare.js';
import DocumentVersion from '../models/DocumentVersion.js';
import { encryptFile, decryptFile } from '../utils/fileEncryption.js';

/**
 * Format document object for clean API response
 */
const formatDocument = (doc) => ({
  _id: doc._id,
  id: doc._id,
  name: doc.name,
  originalName: doc.originalName,
  filePath: doc.filePath,
  mimeType: doc.mimeType,
  fileSize: doc.fileSize,
  owner: doc.owner,
  folder: doc.folder,
  currentVersion: doc.currentVersion || 1,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

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
 * @desc    Upload a new document (Creates Document & Version 1 with file encryption)
 * @route   POST /api/documents/upload
 * @access  Private
 */
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const { folderId, name } = req.body;
    let targetFolderId = null;

    // Validate folder if provided
    if (folderId && folderId !== 'null' && folderId !== 'undefined') {
      if (!mongoose.Types.ObjectId.isValid(folderId)) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Invalid folder ID' });
      }

      const folder = await Folder.findById(folderId);
      if (!folder || folder.owner.toString() !== req.user._id.toString()) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: 'Target folder not found or unauthorized' });
      }
      targetFolderId = folder._id;
    }

    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    const encryptedFilename = `enc-v1-${Date.now()}-${Math.round(Math.random() * 1e9)}.enc`;
    const encryptedPath = path.join(uploadsDir, encryptedFilename);

    // Encrypt file at rest
    await encryptFile(req.file.path, encryptedPath);
    const relativeEncryptedPath = path.join('uploads', encryptedFilename);

    // Create Document record
    const document = await Document.create({
      name: name && name.trim() !== '' ? name.trim() : req.file.originalname,
      originalName: req.file.originalname,
      filePath: relativeEncryptedPath,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      owner: req.user._id,
      folder: targetFolderId,
      currentVersion: 1,
    });

    // Create DocumentVersion version 1 record
    await DocumentVersion.create({
      document: document._id,
      versionNumber: 1,
      filePath: relativeEncryptedPath,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user._id,
    });

    // Populate folder if present
    if (targetFolderId) {
      await document.populate('folder', 'name');
    }

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        ...formatDocument(document),
        role: 'owner',
      },
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    next(error);
  }
};

/**
 * @desc    Get all documents owned by or shared with logged in user
 * @route   GET /api/documents
 * @access  Private
 */
export const getDocuments = async (req, res, next) => {
  try {
    const ownedDocuments = await Document.find({ owner: req.user._id })
      .populate('folder', 'name')
      .sort({ createdAt: -1 });

    const shares = await DocumentShare.find({ user: req.user._id }).populate({
      path: 'document',
      populate: { path: 'folder', select: 'name' },
    });
    const sharedDocuments = shares
      .filter((s) => s.document != null)
      .map((s) => ({
        ...formatDocument(s.document),
        role: s.role,
      }));

    const formattedOwnedDocs = ownedDocuments.map((doc) => ({
      ...formatDocument(doc),
      role: 'owner',
    }));

    res.status(200).json({
      documents: [...formattedOwnedDocs, ...sharedDocuments],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single document by ID
 * @route   GET /api/documents/:id
 * @access  Private (Owner, Editor, Viewer)
 */
export const getDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }

    const document = await Document.findById(id).populate('folder', 'name');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const role = await getDocumentUserRole(document, req.user._id);

    if (!role) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }

    res.status(200).json({
      document: {
        ...formatDocument(document),
        role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download current version of document (decrypts file on the fly)
 * @route   GET /api/documents/:id/download
 * @access  Private (Owner, Editor, Viewer)
 */
export const downloadDocument = async (req, res, next) => {
  let tempDecryptedPath = null;
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

    const encryptedPath = path.resolve(process.cwd(), document.filePath);

    if (!fs.existsSync(encryptedPath)) {
      return res.status(404).json({ message: 'Encrypted file not found on server' });
    }

    // Generate temporary decrypted file path
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    tempDecryptedPath = path.join(uploadsDir, `temp-dec-${Date.now()}-${Math.round(Math.random() * 1e9)}.tmp`);

    await decryptFile(encryptedPath, tempDecryptedPath);

    res.download(tempDecryptedPath, document.originalName, (err) => {
      if (tempDecryptedPath && fs.existsSync(tempDecryptedPath)) {
        try { fs.unlinkSync(tempDecryptedPath); } catch (_) {}
      }
      if (err && !res.headersSent) {
        return res.status(500).json({ message: 'Failed to download document' });
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
 * @desc    Delete a document and all version encrypted files
 * @route   DELETE /api/documents/:id
 * @access  Private (Owner only)
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only owner can delete
    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }

    // Collect all version records and unique encrypted file paths
    const versions = await DocumentVersion.find({ document: id });
    const filePaths = new Set([document.filePath, ...versions.map((v) => v.filePath)]);

    // Delete encrypted files from disk
    filePaths.forEach((relPath) => {
      if (relPath) {
        const absPath = path.resolve(process.cwd(), relPath);
        if (fs.existsSync(absPath)) {
          try { fs.unlinkSync(absPath); } catch (err) { console.error('File delete error:', err.message); }
        }
      }
    });

    // Clean up database records
    await DocumentVersion.deleteMany({ document: id });
    await DocumentShare.deleteMany({ document: id });
    await Document.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Document and all version history deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search documents by name or originalName
 * @route   GET /api/documents/search
 * @access  Private
 */
export const searchDocuments = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ message: "Search query parameter 'q' is required" });
    }

    const searchRegex = new RegExp(q.trim(), 'i');

    const ownedDocuments = await Document.find({
      owner: req.user._id,
      $or: [{ name: searchRegex }, { originalName: searchRegex }],
    })
      .populate('folder', 'name')
      .sort({ createdAt: -1 });

    const shares = await DocumentShare.find({ user: req.user._id }).populate({
      path: 'document',
      match: { $or: [{ name: searchRegex }, { originalName: searchRegex }] },
      populate: { path: 'folder', select: 'name' },
    });

    const sharedDocuments = shares
      .filter((s) => s.document != null)
      .map((s) => ({
        ...formatDocument(s.document),
        role: s.role,
      }));

    const formattedOwnedDocs = ownedDocuments.map((doc) => ({
      ...formatDocument(doc),
      role: 'owner',
    }));

    const results = [...formattedOwnedDocs, ...sharedDocuments];

    res.status(200).json({
      query: q.trim(),
      resultsCount: results.length,
      documents: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Move document to a folder (or root if folderId is null)
 * @route   PUT /api/documents/:id/move
 * @access  Private (Owner only)
 */
export const moveDocumentToFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { folderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only owner can move
    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }

    let targetFolderId = null;

    if (folderId && folderId !== null && folderId !== 'null' && folderId !== '') {
      if (!mongoose.Types.ObjectId.isValid(folderId)) {
        return res.status(400).json({ message: 'Invalid target folder ID' });
      }

      const folder = await Folder.findById(folderId);
      if (!folder || folder.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Target folder not found or unauthorized' });
      }

      targetFolderId = folder._id;
    }

    document.folder = targetFolderId;
    await document.save();
    if (targetFolderId) {
      await document.populate('folder', 'name');
    }

    res.status(200).json({
      message: 'Document moved successfully',
      document: {
        ...formatDocument(document),
        role: 'owner',
      },
    });
  } catch (error) {
    next(error);
  }
};
