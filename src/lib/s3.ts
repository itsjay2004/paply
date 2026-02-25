/**
 * S3 client and helpers for storing user-uploaded PDFs (private bucket).
 * Store the S3 key in papers.pdf_url; use getPresignedPdfUrl() to generate temporary access URLs.
 * Requires AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_PDF_BUCKET in env.
 */

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function getS3Config() {
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_PDF_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!bucket || !region) {
    throw new Error(
      'AWS S3 is not configured. Set AWS_REGION and AWS_S3_PDF_BUCKET in your environment.'
    );
  }

  return {
    region,
    bucket,
    credentials:
      accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined,
  };
}

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const { region, credentials } = getS3Config();
    s3Client = new S3Client({
      region,
      ...(credentials && { credentials }),
    });
  }
  return s3Client;
}

export interface UploadPdfToS3Params {
  userId: string;
  /** Unique id for this upload (e.g. uuid). Used in key; one file per id. */
  objectKeyId: string;
  file: Buffer;
  contentType?: string;
}

/**
 * Upload a PDF to S3 and return its object key (for storing in DB).
 * Key format: uploads/{userId}/{objectKeyId}.pdf — one file per import, no nested folders.
 * Use getPresignedPdfUrl(key) to generate a temporary download URL.
 */
export async function uploadPdfToS3(params: UploadPdfToS3Params): Promise<string> {
  const { userId, objectKeyId, file, contentType = 'application/pdf' } = params;

  if (file.length > MAX_PDF_SIZE_BYTES) {
    throw new Error(`PDF must be 10 MB or smaller (got ${(file.length / 1024 / 1024).toFixed(2)} MB).`);
  }

  const { bucket } = getS3Config();
  const key = `uploads/${userId}/${objectKeyId}.pdf`;

  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  );

  return key;
}

const DEFAULT_PRESIGN_EXPIRES_IN = 3600; // 1 hour
const PRESIGNED_PUT_EXPIRES_IN = 900; // 15 minutes for client uploads

/**
 * Generate a presigned PUT URL so the client can upload a PDF directly to S3.
 * Key format: uploads/{userId}/{objectKeyId}.pdf
 * Returns the key so the client can pass it to the server for extraction.
 */
export async function getPresignedPutUrl(
  userId: string,
  objectKeyId: string,
  expiresInSeconds: number = PRESIGNED_PUT_EXPIRES_IN
): Promise<{ putUrl: string; key: string }> {
  const { bucket } = getS3Config();
  const key = `uploads/${userId}/${objectKeyId}.pdf`;
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: 'application/pdf',
  });
  const putUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  return { putUrl, key };
}

/**
 * Fetch a PDF from S3 and return its body as a Buffer.
 * Used by the server to run extraction after client has uploaded via presigned PUT.
 */
export async function getPdfBufferFromS3(key: string): Promise<Buffer> {
  const { bucket } = getS3Config();
  const client = getS3Client();
  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );
  const body = response.Body;
  if (!body) {
    throw new Error('Empty object body');
  }
  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Generate a presigned GET URL for an S3 object (private bucket).
 * Use this when serving PDFs to the user.
 */
export async function getPresignedPdfUrl(
  key: string,
  expiresInSeconds: number = DEFAULT_PRESIGN_EXPIRES_IN
): Promise<string> {
  const { bucket } = getS3Config();
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Resolve pdf_url from DB to an S3 object key.
 * We store the key in pdf_url (e.g. "uploads/user_123/uuid.pdf").
 * Legacy: also supports public URL format from our bucket (returns key).
 */
export function parseS3KeyFromPdfUrl(pdfUrl: string | null | undefined): string | null {
  if (!pdfUrl || typeof pdfUrl !== 'string') return null;
  if (pdfUrl.startsWith('uploads/')) return pdfUrl;
  const bucket = process.env.AWS_S3_PDF_BUCKET;
  if (!bucket) return null;
  const pattern = new RegExp(
    `^https://${bucket}\\.s3\\.[a-z0-9-]+\\.amazonaws\\.com/(.+)$`
  );
  const match = pdfUrl.match(pattern);
  return match ? match[1] : null;
}

/**
 * True if pdf_url is our S3 key (private bucket); false if external URL or empty.
 */
export function isS3KeyPdfUrl(pdfUrl: string | null | undefined): boolean {
  return Boolean(pdfUrl && typeof pdfUrl === 'string' && pdfUrl.startsWith('uploads/'));
}

/**
 * Delete an object from S3 by key. No-op if key is null or delete fails (e.g. not found).
 */
export async function deletePdfFromS3(key: string): Promise<void> {
  const { bucket } = getS3Config();
  const client = getS3Client();
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  } catch (err) {
    console.error('[S3] Failed to delete object:', key, err);
  }
}
