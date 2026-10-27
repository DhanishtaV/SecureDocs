import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original name is required'],
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    mimeType: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model('Document', documentSchema);

export default Document;
