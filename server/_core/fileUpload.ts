/**
 * Document upload functionality for loan applications
 * Uses AWS S3 for file storage
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ENV } from './env';
import { logger } from './logging';
import * as fs from 'fs';
import * as path from 'path';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'amerilend-documents';
const USE_LOCAL_STORAGE = !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY;
const LOCAL_STORAGE_PATH = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

export enum DocumentType {
  ID_PROOF = 'id_proof',
  ADDRESS_PROOF = 'address_proof',
  INCOME_PROOF = 'income_proof',
  BANK_STATEMENT = 'bank_statement',
  TAX_RETURN = 'tax_return',
  OTHER = 'other',
}

export interface UploadedDocument {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  documentType: DocumentType;
  s3Key: string;
  url?: string;
  uploadedAt: Date;
}

export interface UploadOptions {
  userId: number;
  loanApplicationId?: number;
  documentType: DocumentType;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

/**
 * Validate file before upload
 */
export function validateFile(fileName: string, mimeType: string, fileSize: number): { valid: boolean; error?: string } {
  // Check file size
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check mime type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `File type ${mimeType} is not allowed. Allowed types: PDF, JPG, PNG, GIF, DOC, DOCX`,
    };
  }

  // Check file extension matches mime type
  const ext = fileName.toLowerCase().split('.').pop();
  const mimeToExt: Record<string, string[]> = {
    'application/pdf': ['pdf'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'application/msword': ['doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  };

  const expectedExts = mimeToExt[mimeType] || [];
  if (ext && !expectedExts.includes(ext)) {
    return {
      valid: false,
      error: 'File extension does not match file type',
    };
  }

  return { valid: true };
}

/**
 * Generate S3 key for file
 */
export function generateS3Key(options: UploadOptions): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const ext = options.fileName.split('.').pop();
  
  const basePath = options.loanApplicationId
    ? `loans/${options.loanApplicationId}`
    : `users/${options.userId}`;
  
  return `${basePath}/${options.documentType}/${timestamp}_${randomId}.${ext}`;
}

/**
 * Upload file to S3 or local storage
 */
export async function uploadDocument(
  fileBuffer: Buffer,
  options: UploadOptions
): Promise<UploadedDocument> {
  try {
    // Validate file
    const validation = validateFile(options.fileName, options.mimeType, options.fileSize);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generate S3 key
    const s3Key = generateS3Key(options);

    if (USE_LOCAL_STORAGE) {
      // Save to local file system
      if (!fs.existsSync(LOCAL_STORAGE_PATH)) {
        fs.mkdirSync(LOCAL_STORAGE_PATH, { recursive: true });
      }
      
      const filePath = path.join(LOCAL_STORAGE_PATH, s3Key);
      const fileDir = path.dirname(filePath);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, fileBuffer);
      
      logger.info('Document saved locally', {
        userId: options.userId,
        loanApplicationId: options.loanApplicationId,
        s3Key,
        fileSize: options.fileSize,
      });
    } else {
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: options.mimeType,
        Metadata: {
          userId: options.userId.toString(),
          loanApplicationId: options.loanApplicationId?.toString() || '',
          documentType: options.documentType,
          originalFileName: options.fileName,
        },
      });

      await s3Client.send(command);

      logger.info('Document uploaded to S3', {
        userId: options.userId,
        loanApplicationId: options.loanApplicationId,
        s3Key,
        fileSize: options.fileSize,
      });
    }

    return {
      id: s3Key,
      fileName: options.fileName,
      fileSize: options.fileSize,
      mimeType: options.mimeType,
      documentType: options.documentType,
      s3Key,
      uploadedAt: new Date(),
    };
  } catch (error) {
    logger.error('Failed to upload document', error as Error, {
      userId: options.userId,
      fileName: options.fileName,
    });
    throw new Error('Failed to upload document. Please try again.');
  }
}

/**
 * Generate presigned URL for upload (direct from browser)
 */
export async function generateUploadUrl(
  options: UploadOptions
): Promise<{ uploadUrl: string; s3Key: string }> {
  try {
    // Validate file
    const validation = validateFile(options.fileName, options.mimeType, options.fileSize);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generate S3 key
    const s3Key = generateS3Key(options);

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: options.mimeType,
      Metadata: {
        userId: options.userId.toString(),
        loanApplicationId: options.loanApplicationId?.toString() || '',
        documentType: options.documentType,
        originalFileName: options.fileName,
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    return { uploadUrl, s3Key };
  } catch (error) {
    logger.error('Failed to generate upload URL', error as Error);
    throw new Error('Failed to generate upload URL. Please try again.');
  }
}

/**
 * Generate presigned URL for download (or local file URL)
 */
export async function generateDownloadUrl(s3Key: string): Promise<string> {
  try {
    if (USE_LOCAL_STORAGE) {
      // Return local file URL
      const filePath = path.join(LOCAL_STORAGE_PATH, s3Key);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }
      
      // Read file and convert to base64 data URL
      const fileBuffer = fs.readFileSync(filePath);
      
      // Detect mime type from file extension
      const ext = path.extname(s3Key).toLowerCase().substring(1);
      let mimeType = 'image/jpeg';
      if (ext === 'pdf') mimeType = 'application/pdf';
      else if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'gif') mimeType = 'image/gif';
      else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
      
      // Return as base64 data URL
      const base64 = fileBuffer.toString('base64');
      return `data:${mimeType};base64,${base64}`;
    } else {
      // Use S3 presigned URL
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
      return url;
    }
  } catch (error) {
    logger.error('Failed to generate download URL', error as Error, { s3Key });
    throw new Error('Failed to generate download URL. Please try again.');
  }
}

/**
 * Delete document from S3 or local storage
 */
export async function deleteDocument(s3Key: string): Promise<void> {
  try {
    if (USE_LOCAL_STORAGE) {
      // Delete from local file system
      const filePath = path.join(LOCAL_STORAGE_PATH, s3Key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info('Document deleted from local storage', { s3Key });
      }
    } else {
      // Delete from S3
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
      });

      await s3Client.send(command);
      logger.info('Document deleted from S3', { s3Key });
    }
  } catch (error) {
    logger.error('Failed to delete document', error as Error, { s3Key });
    throw new Error('Failed to delete document. Please try again.');
  }
}

/**
 * Get file extension from mime type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  };

  return mimeToExt[mimeType] || 'bin';
}
