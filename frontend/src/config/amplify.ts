import { Amplify } from 'aws-amplify';

interface AmplifyConfig {
  auth: {
    user_pool_id: string;
    aws_region: string;
    user_pool_client_id: string;
    identity_pool_id: string;
  };
  data: {
    url: string;
    aws_region: string;
    api_key?: string;
    default_authorization_type: string;
    authorization_types: string[];
  };
}

/**
 * Configure Amplify with the backend resources
 * This function looks for amplify_outputs.json which is generated during deployment
 * For local development, you can create a local-outputs.json with your development environment settings
 */
export function configureAmplify() {
  try {
    // Try to load production outputs
    const outputs = require('../../amplify_outputs.json');
    Amplify.configure(outputs, { ssr: true });
  } catch (error) {
    console.warn('Unable to load Amplify outputs. Looking for local configuration...');
    
    try {
      // Try to load local development outputs
      const localOutputs = require('../../local-outputs.json');
      Amplify.configure(localOutputs, { ssr: true });
    } catch (localError) {
      console.warn(
        'No configuration found. Please ensure either amplify_outputs.json or local-outputs.json exists.',
        'You can create these files by deploying the backend or setting up local development environment.'
      );
    }
  }
}
