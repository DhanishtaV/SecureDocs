import mongoose from 'mongoose';

const documentVersionSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Document reference is required'],
    },
    versionNumber: {
      type: Number,
      required: [true, 'Version number is required'],
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    originalName: {
      type: String,
      required: [true, 'Original name is required'],
    },
    mimeType: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'UploadedBy user reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring unique version numbers per document
documentVersionSchema.index({ document: 1, versionNumber: 1 }, { unique: true });

const DocumentVersion = mongoose.model('DocumentVersion', documentVersionSchema);

export default DocumentVersion;
