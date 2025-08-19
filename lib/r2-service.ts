import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Config, validateR2Config, generateFileKey, getPublicUrl } from './r2-config';
import { log, trackError } from './logger';

export enum UploadErrorType {
  CONFIGURATION = 'configuration',
  NETWORK = 'network',
  FILE_READ = 'file_read',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
  errorType?: UploadErrorType;
}

export interface MediaFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

class R2Service {
  private client: S3Client | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    if (!validateR2Config()) {
      return;
    }

    this.client = new S3Client({
      region: r2Config.region,
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(file: MediaFile, prefix: string = 'media'): Promise<UploadResult> {
    if (!this.client) {
      const configValid = validateR2Config();
      return {
        success: false,
        error: `R2 client not initialized - ${configValid ? 'client initialization failed' : 'configuration missing or invalid'}`,
        errorType: UploadErrorType.CONFIGURATION
      };
    }

    if (!file || !file.uri) {
      return { 
        success: false, 
        error: 'Invalid file provided', 
        errorType: UploadErrorType.FILE_READ 
      };
    }

    try {
      const key = generateFileKey(file.name, prefix);

      let body: Uint8Array;
      try {
        const response = await fetch(file.uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        try {
          const arrayBuffer = await response.arrayBuffer();
          body = new Uint8Array(arrayBuffer);
        } catch {
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          body = new Uint8Array(arrayBuffer);
        }
      } catch (fileReadError) {
        return {
          success: false,
          error: `Failed to read file: ${fileReadError instanceof Error ? fileReadError.message : 'Unknown file read error'}`,
          errorType: UploadErrorType.FILE_READ
        };
      }

      if (!body || body.byteLength === 0) {
        return {
          success: false,
          error: 'File appears to be empty or corrupted',
          errorType: UploadErrorType.FILE_READ
        };
      }

      const command = new PutObjectCommand({
        Bucket: r2Config.bucketName,
        Key: key,
        Body: body,
        ContentType: file.type,
        ContentLength: body.byteLength,
      });

      await this.client.send(command);

      const url = getPublicUrl(key);

      return { success: true, url, key };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      trackError(error as Error, 'R2Service.uploadFile', {
        fileName: file.name,
        fileSize: file.size,
      });
      return {
        success: false,
        error: errorMessage,
        errorType: this.categorizeError(error)
      };
    }
  }

  private categorizeError(error: unknown): UploadErrorType {
    if (!error) return UploadErrorType.UNKNOWN;
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    if (errorMessage.includes('credentials') || 
        errorMessage.includes('access denied') || 
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('invalid access key') ||
        errorMessage.includes('signature')) {
      return UploadErrorType.CONFIGURATION;
    }
    if (errorMessage.includes('network') || 
        errorMessage.includes('timeout') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('enotfound') ||
        errorMessage.includes('econnrefused')) {
      return UploadErrorType.NETWORK;
    }
    if (errorMessage.includes('file') && 
        (errorMessage.includes('read') || errorMessage.includes('access') || errorMessage.includes('not found'))) {
      return UploadErrorType.FILE_READ;
    }
    if (errorMessage.includes('500') || 
        errorMessage.includes('502') || 
        errorMessage.includes('503') || 
        errorMessage.includes('504') ||
        errorMessage.includes('internal server error')) {
      return UploadErrorType.SERVER;
    }
    return UploadErrorType.UNKNOWN;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string | null> {
    if (!this.client) {
      return null;
    }
    try {
      const command = new GetObjectCommand({
        Bucket: r2Config.bucketName,
        Key: key,
      });
      const signedUrl = await getSignedUrl(this.client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      return null;
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      const command = new DeleteObjectCommand({ Bucket: r2Config.bucketName, Key: key });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}

export const r2Service = new R2Service();
export default r2Service;
