import { execute } from '@evershop/postgres-query-builder';

export default async (connection) => {
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "email_notification_template" (
      "email_notification_template_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "uuid" UUID NOT NULL DEFAULT gen_random_uuid (),
      "template_key" varchar NOT NULL,
      "name" varchar NOT NULL,
      "description" text DEFAULT NULL,
      "html_template" text NOT NULL,
      "text_template" text NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "EMAIL_NOTIFICATION_TEMPLATE_UUID_UNIQUE" UNIQUE ("uuid"),
      CONSTRAINT "EMAIL_NOTIFICATION_TEMPLATE_KEY_UNIQUE" UNIQUE ("template_key")
    )`
  );

  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "email_notification_log" (
      "email_notification_log_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "uuid" UUID NOT NULL DEFAULT gen_random_uuid (),
      "notification_type" varchar NOT NULL,
      "event_key" varchar DEFAULT NULL,
      "recipient" varchar NOT NULL,
      "provider" varchar DEFAULT NULL,
      "status" varchar NOT NULL DEFAULT 'pending',
      "error_message" text DEFAULT NULL,
      "attempts" integer NOT NULL DEFAULT 0,
      "related_order_id" integer DEFAULT NULL,
      "related_customer_id" integer DEFAULT NULL,
      "metadata" jsonb DEFAULT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "EMAIL_NOTIFICATION_LOG_UUID_UNIQUE" UNIQUE ("uuid")
    )`
  );

  await execute(
    connection,
    `CREATE UNIQUE INDEX IF NOT EXISTS "EMAIL_NOTIFICATION_LOG_EVENT_KEY_UNIQUE"
      ON "email_notification_log" ("event_key")
      WHERE "event_key" IS NOT NULL`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "EMAIL_NOTIFICATION_LOG_CREATED_AT_INDEX"
      ON "email_notification_log" ("created_at")`
  );
};
