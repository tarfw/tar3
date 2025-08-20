// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react-native";

const rules = {
  // Foundation database permissions for user management and app registry
  
  // $users entity - managed by Instant DB auth system
  $users: {
    allow: {
      view: "true", // Allow viewing user data
      create: "false", // Managed by Instant auth
      update: "false", // Managed by Instant auth
      delete: "false", // Managed by Instant auth
    },
  },
  
  // app entity - user's app registry
  app: {
    allow: {
      view: "true", // Allow viewing apps
      create: "auth.id != null", // Only authenticated users can create
      update: "auth.id != null", // Only authenticated users can update
      delete: "auth.id != null", // Only authenticated users can delete
    },
  },
  
  // $files entity - file storage
  $files: {
    allow: {
      view: "true", // Allow viewing files
      create: "auth.id != null", // Only authenticated users can create
      update: "auth.id != null", // Only authenticated users can update
      delete: "auth.id != null", // Only authenticated users can delete
    },
  },
} satisfies InstantRules;

export default rules;
