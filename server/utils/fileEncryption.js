import crypto from 'crypto';
import fs from 'fs';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for AES-GCM
const AUTH_TAG_LENGTH = 16; // 128-bit Auth Tag

/**
 * Derive a consistent 32-byte key from ENCRYPTION_KEY using SHA-256
 */
const getEncryptionKey = () => {
  const secret = process.env.ENCRYPTION_KEY || 'default_fallback_32_byte_secret_key!';
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypt a plaintext file on disk and delete the temporary plaintext input file
 * Output binary format: [IV (12 bytes)][AuthTag (16 bytes)][Ciphertext...]
 */
export const encryptFile = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const key = getEncryptionKey();
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

      const inputBuffer = fs.readFileSync(inputPath);
      const encryptedData = Buffer.concat([cipher.update(inputBuffer), cipher.final()]);
      const authTag = cipher.getAuthTag();

      // Combine IV (12B) + AuthTag (16B) + Encrypted Data
      const finalBuffer = Buffer.concat([iv, authTag, encryptedData]);
      fs.writeFileSync(outputPath, finalBuffer);

      // Remove plaintext file after successful encryption
      if (fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }

      resolve(outputPath);
    } catch (error) {
      if (fs.existsSync(inputPath)) {
        try { fs.unlinkSync(inputPath); } catch (_) {}
      }
      reject(error);
    }
  });
};

/**
 * Decrypt an encrypted file on disk to a temporary decrypted file
 */
export const decryptFile = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const key = getEncryptionKey();
      const fileBuffer = fs.readFileSync(inputPath);

      if (fileBuffer.length < IV_LENGTH + AUTH_TAG_LENGTH) {
        throw new Error('Encrypted file format invalid or corrupted');
      }

      const iv = fileBuffer.subarray(0, IV_LENGTH);
      const authTag = fileBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
      const ciphertext = fileBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      const decryptedBuffer = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      fs.writeFileSync(outputPath, decryptedBuffer);

      resolve(outputPath);
    } catch (error) {
      if (fs.existsSync(outputPath)) {
        try { fs.unlinkSync(outputPath); } catch (_) {}
      }
      reject(error);
    }
  });
};
