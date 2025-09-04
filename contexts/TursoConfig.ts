// Turso DB Configuration
export const TURSO_DB_NAME = 'tar.db';

// Dynamic turso options that will be set per user
export let tursoOptions = {
  url: undefined as string | undefined,
  authToken: undefined as string | undefined,
} as const;

// Function to update turso options for a specific user
export const updateUserTursoOptions = (url: string, authToken: string) => {
  tursoOptions = {
    url,
    authToken,
  };
};