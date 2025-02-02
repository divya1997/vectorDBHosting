import { defineAuth } from '@aws-amplify/backend';

/**
 * Define authentication configuration for VectorDBBuilder
 * - Email-based login
 * - Required email verification
 * - Password policy for security
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    phone: false,
    username: false,
    preferredUsername: false
  }
});
