import { Amplify } from 'aws-amplify';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';

export const configureAWS = () => {
  // Configure Amplify
  Amplify.configure({
    Auth: {
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      mandatorySignIn: false,
    },
    API: {
      endpoints: [
        {
          name: 'vectordb',
          endpoint: process.env.NEXT_PUBLIC_API_URL,
        },
      ],
    },
    Storage: {
      AWSS3: {
        bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
        region: process.env.NEXT_PUBLIC_AWS_REGION,
      },
    },
  });

  // Initialize DynamoDB client
  const dynamoClient = new DynamoDBClient({
    region: process.env.NEXT_PUBLIC_AWS_REGION,
  });

  // Initialize S3 client
  const s3Client = new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_REGION,
  });

  return {
    dynamoClient,
    s3Client,
  };
};

// Export initialized clients
export const awsClients = configureAWS();
