import { id } from './instant';

/**
 * InstantDB recommended ID generation utilities
 * Following the patterns from InstantDB React Native documentation
 */

// Generate a new unique ID using InstantDB's id() function
export const generateId = () => id();

// Generate a local ID for React components using InstantDB's useLocalId hook
// This should be used within React components only
export const useLocalId = (key: string) => {
  // This will be imported from the db instance in components
  // db.useLocalId(key)
  return key;
};

// Generate consistent demo IDs for development
export const generateDemoId = (prefix: string, suffix?: string) => {
  const base = `demo-${prefix}`;
  return suffix ? `${base}-${suffix}` : `${base}-${Date.now()}`;
};

// Generate project-specific issue identifier
export const generateIssueIdentifier = (projectKey: string, issueNumber?: number) => {
  const number = issueNumber || Math.floor(Date.now() / 1000) % 10000;
  return `${projectKey.toUpperCase()}-${number}`;
};

// Generate sequential-like IDs for demo purposes
export const generateSequentialId = (prefix: string) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
};

// Validate UUID format (for compatibility checks)
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Generate a short ID for display purposes
export const generateShortId = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Export the main ID generation function as default
export default generateId;