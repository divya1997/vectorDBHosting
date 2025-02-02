import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { awsClients } from '../config/aws-config';

// File upload to S3
export const uploadFileToS3 = async (file: File, key: string) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
      Key: key,
      Body: file,
      ContentType: file.type,
    });

    await awsClients.s3Client.send(command);
    return `https://${process.env.NEXT_PUBLIC_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// File download from S3
export const downloadFileFromS3 = async (key: string) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
      Key: key,
    });

    const response = await awsClients.s3Client.send(command);
    return response.Body;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

// Generate a unique file key for S3
export const generateS3Key = (fileName: string) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  return `uploads/${timestamp}-${randomString}-${fileName}`;
};
