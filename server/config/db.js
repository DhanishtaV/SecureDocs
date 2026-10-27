import mongoose from 'mongoose';
import dns from 'dns';

// Ensure public DNS fallback for Windows Node.js querySrv resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // If setting DNS fails in certain environments, continue with system defaults
}

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log('[Database] MongoDB connected successfully!');
    console.log(`[Database] Cluster Host: ${conn.connection.host}`);
    console.log(`[Database] Active Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    if (
      error.message.includes('SSL alert number 80') ||
      error.message.includes('Could not connect to any servers') ||
      error.message.includes('MongoServerSelectionError')
    ) {
      console.error(
        '[Atlas Security Notice] Your IP may not be whitelisted on MongoDB Atlas. Please ensure your IP (or 0.0.0.0/0) is added to MongoDB Atlas -> Network Access.'
      );
    }
    process.exit(1);
  }
};

export default connectDB;
