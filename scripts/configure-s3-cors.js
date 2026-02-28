#!/usr/bin/env node
/**
 * Configure S3 bucket CORS for direct client uploads
 * 
 * Usage:
 *   node scripts/configure-s3-cors.js
 * 
 * Requires:
 *   - AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in environment
 *   - AWS_REGION and AWS_S3_PDF_BUCKET in environment
 */

const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

const region = process.env.AWS_REGION;
const bucket = process.env.AWS_S3_PDF_BUCKET;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!bucket || !region) {
  console.error('Error: AWS_REGION and AWS_S3_PDF_BUCKET must be set in .env.local');
  process.exit(1);
}

if (!accessKeyId || !secretAccessKey) {
  console.error('Error: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set in .env.local');
  process.exit(1);
}

// Get the origin from environment or use wildcard for development
// In production, replace with your actual domain
const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || '*';

const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: [
        'Content-Type',
        'Content-MD5',
        'x-amz-content-sha256',
        'x-amz-date',
        'x-amz-security-token',
        'x-amz-user-agent',
        'x-amz-checksum-crc32',
        'x-amz-sdk-checksum-algorithm',
      ],
      AllowedMethods: ['PUT', 'POST', 'GET', 'HEAD', 'OPTIONS'],
      AllowedOrigins: [allowedOrigin],
      ExposeHeaders: ['ETag', 'x-amz-request-id'],
      MaxAgeSeconds: 3600,
    },
  ],
};

async function configureCors() {
  const client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  try {
    console.log(`Configuring CORS for bucket: ${bucket}`);
    console.log(`Allowed origin: ${allowedOrigin}`);
    
    const command = new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: corsConfiguration,
    });

    await client.send(command);
    console.log('✅ CORS configuration applied successfully!');
    console.log('\nNote: If you\'re using a wildcard (*) origin, consider restricting it to your specific domain in production.');
  } catch (error) {
    console.error('❌ Failed to configure CORS:', error.message);
    if (error.name === 'AccessDenied') {
      console.error('\nMake sure your AWS credentials have s3:PutBucketCors permission.');
    }
    process.exit(1);
  }
}

configureCors();
