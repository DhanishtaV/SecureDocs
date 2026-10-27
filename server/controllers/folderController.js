import Folder from '../models/Folder.js';
import Document from '../models/Document.js';
import mongoose from 'mongoose';

/**
 * @desc    Create a new folder
 * @route   POST /api/folders
 * @access  Private
 */
export const createFolder = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    const folder = await Folder.create({
      name: name.trim(),
      owner: req.user._id,
    });

    res.status(201).json({
      message: 'Folder created successfully',
      folder: {
        _id: folder._id,
        id: folder._id,
        name: folder.name,
        owner: folder.owner,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all folders for logged in user
 * @route   GET /api/folders
 * @access  Private
 */
export const getFolders = async (req, res, next) => {
  try {
    const folders = await Folder.find({ owner: req.user._id }).sort({ createdAt: -1 });

    const formattedFolders = folders.map((folder) => ({
      _id: folder._id,
      id: folder._id,
      name: folder.name,
      owner: folder.owner,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    }));

    res.status(200).json({
      folders: formattedFolders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a folder
 * @route   DELETE /api/folders/:id
 * @access  Private
 */
export const deleteFolder = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid folder ID' });
    }

    const folder = await Folder.findById(id);

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Check ownership
    if (folder.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this folder' });
    }

    // Set folder field to null for all documents in this folder before deleting
    await Document.updateMany(
      { folder: id, owner: req.user._id },
      { folder: null }
    );

    await Folder.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Folder deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
