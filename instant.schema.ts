// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react-native";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
    }),
    app: i.entity({
      appid: i.string().optional(),
      tursoDbName: i.string().optional(),
      tursoDbAuthToken: i.string().optional(),
    }),
  },
  links: {
    app$users: {
      forward: {
        on: "app",
        has: "many",
        label: "$users",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "app",
      },
    },
  },
  rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
