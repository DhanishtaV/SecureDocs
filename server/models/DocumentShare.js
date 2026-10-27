import mongoose from 'mongoose';

const documentShareSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Document reference is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    role: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'viewer',
      required: true,
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'SharedBy reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate shares of the same document to the same user
documentShareSchema.index({ document: 1, user: 1 }, { unique: true });

const DocumentShare = mongoose.model('DocumentShare', documentShareSchema);

export default DocumentShare;
