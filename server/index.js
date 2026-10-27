import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import versionRoutes from './routes/versionRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from the server directory regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health-check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'SecureDocs API Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api', shareRoutes);
app.use('/api', versionRoutes);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.message);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`[Server] SecureDocs backend listening on port ${PORT}`);
});
