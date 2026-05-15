import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
  boolean,
  primaryKey
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id:           text("id").primaryKey(),
  email:        text("email").notNull().unique(),
  name:         text("name").notNull().default(""),
  picture:      text("picture").notNull().default(""),
  passwordHash: text("password_hash"),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const projects = pgTable("projects", {
  id:           text("id").primaryKey(),
  userId:       text("user_id"),
  name:         text("name").notNull(),
  description:  text("description").notNull().default(""),
  workflowJson: jsonb("workflow_json").notNull().default({}),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const savedWorkflows = pgTable("saved_workflows", {
  id:           text("id").primaryKey(),
  name:         text("name").notNull().default(""),
  workflowJson: jsonb("workflow_json").notNull().default({}),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id:        text("id").primaryKey(),
  userId:    text("user_id").notNull(),
  token:     text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used:      boolean("used").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const projectApiKeys = pgTable(
  "project_api_keys",
  {
    projectId:    text("project_id").notNull(),
    providerId:   text("provider_id").notNull(),
    encryptedKey: text("encrypted_key").notNull(),
    createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:    timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [primaryKey({ columns: [table.projectId, table.providerId] })]
);

export const customProviders = pgTable("custom_providers", {
  id:              uuid("id").primaryKey().defaultRandom(),
  projectId:       text("project_id").notNull(),
  name:            text("name").notNull(),
  type:            text("type").notNull(),
  baseUrl:         text("base_url").notNull(),
  authHeaderName:  text("auth_header_name").notNull().default("Authorization"),
  models:          jsonb("models").notNull().default([]),
  requestTemplate: text("request_template"),
  responsePath:    text("response_path"),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
