import { defineAuth } from '@aws-amplify/backend';

/**
 * Define authentication configuration for VectorDBBuilder
 * - Email-based login with strong password policy
 * - Required email verification
 * - Multi-factor authentication (optional)
 * - Custom user attributes
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    phone: false,
    username: false,
    preferredUsername: false
  },
  verification: {
    email: {
      required: true
    }
  },
  multiFactor: {
    mode: 'OPTIONAL',
    sms: true
  },
  passwordPolicy: {
    minLength: 8,
    complexity: {
      requireNumbers: true,
      requireSpecialCharacters: true,
      requireLowercase: true,
      requireUppercase: true
    }
  },
  userAttributes: {
    companyName: {
      required: false,
      mutable: true
    },
    planTier: {
      required: false,
      mutable: true,
      default: 'free'
    }
  }
});
