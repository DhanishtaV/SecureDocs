import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// Allowed MIME types and extensions
const allowedExtensions = [
  '.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx',
  '.ppt', '.pptx', '.csv', '.png', '.jpg', '.jpeg',
  '.gif', '.webp', '.svg'
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file format (${ext}). Allowed formats: ${allowedExtensions.join(', ')}`
      ),
      false
    );
  }
};

// Multer upload instance
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter,
});

// Middleware wrapper to handle Multer errors cleanly
export const handleUpload = (fieldname) => {
  return (req, res, next) => {
    const uploadSingle = upload.single(fieldname);
    uploadSingle(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size exceeds maximum limit of 10MB' });
        }
        return res.status(400).json({ message: `File upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };
};
