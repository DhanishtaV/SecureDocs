import mongoose from 'mongoose';
import Document from '../models/Document.js';
import User from '../models/User.js';
import DocumentShare from '../models/DocumentShare.js';

/**
 * @desc    Share a document with another user
 * @route   POST /api/documents/:documentId/share
 * @access  Private (Owner only)
 */
export const shareDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { email, role = 'viewer' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only document owner can share
    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }

    if (!email || email.trim() === '') {
      return res.status(400).json({ message: 'Please provide user email' });
    }

    // Validate role
    if (!['viewer', 'editor'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Role must be viewer or editor' });
    }

    // Find target user
    const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent sharing with self
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot share a document with yourself' });
    }

    // Check for existing share
    const existingShare = await DocumentShare.findOne({
      document: documentId,
      user: targetUser._id,
    });

    if (existingShare) {
      return res.status(400).json({ message: 'Document is already shared with this user' });
    }

    const share = await DocumentShare.create({
      document: documentId,
      user: targetUser._id,
      role,
      sharedBy: req.user._id,
    });

    res.status(201).json({
      message: 'Document shared successfully',
      share: {
        id: share._id,
        user: {
          id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
        },
        role: share.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of users a document is shared with
 * @route   GET /api/documents/:documentId/shares
 * @access  Private (Owner only)
 */
export const getDocumentShares = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ message: 'Invalid document ID' });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only document owner can view shares
    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }

    const shares = await DocumentShare.find({ document: documentId }).populate('user', 'name email');

    const formattedShares = shares.map((s) => ({
      id: s._id,
      user: {
        id: s.user._id,
        name: s.user.name,
        email: s.user.email,
      },
      role: s.role,
      createdAt: s.createdAt,
    }));

    res.status(200).json({
      shares: formattedShares,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update share permissions for a user
 * @route   PUT /api/documents/:documentId/share/:userId
 * @access  Private (Owner only)
 */
export const updateDocumentShare = async (req, res, next) => {
  try {
    const { documentId, userId } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(documentId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid document ID or user ID' });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only document owner can update shares
    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }

    if (!['viewer', 'editor'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Role must be viewer or editor' });
    }

    const share = await DocumentShare.findOne({ document: documentId, user: userId });

    if (!share) {
      return res.status(404).json({ message: 'Share record not found for this user' });
    }

    share.role = role;
    await share.save();
    await share.populate('user', 'name email');

    res.status(200).json({
      message: 'Share permissions updated successfully',
      share: {
        id: share._id,
        user: {
          id: share.user._id,
          name: share.user.name,
          email: share.user.email,
        },
        role: share.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove share access for a user
 * @route   DELETE /api/documents/:documentId/share/:userId
 * @access  Private (Owner only)
 */
export const removeDocumentShare = async (req, res, next) => {
  try {
    const { documentId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(documentId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid document ID or user ID' });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only document owner can remove share access
    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }

    const share = await DocumentShare.findOneAndDelete({ document: documentId, user: userId });

    if (!share) {
      return res.status(404).json({ message: 'Share record not found' });
    }

    res.status(200).json({
      message: 'Access removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
