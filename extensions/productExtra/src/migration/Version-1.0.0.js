// Migration: create product_review, product_trust_badge, product_spec_badge tables
import { execute } from '@evershop/postgres-query-builder';

export default async function Migration(connection) {
  // ── product_review ──
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "product_review" (
      "review_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
      "product_id" INT NOT NULL,
      "customer_id" INT NOT NULL,
      "rating" INT NOT NULL,
      "comment" TEXT DEFAULT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PRODUCT_REVIEW_UUID_UNIQUE" UNIQUE ("uuid"),
      CONSTRAINT "FK_REVIEW_PRODUCT" FOREIGN KEY ("product_id") REFERENCES "product" ("product_id") ON DELETE CASCADE,
      CONSTRAINT "FK_REVIEW_CUSTOMER" FOREIGN KEY ("customer_id") REFERENCES "customer" ("customer_id") ON DELETE CASCADE,
      CONSTRAINT "CHECK_RATING_RANGE" CHECK ("rating" >= 0 AND "rating" <= 5),
      CONSTRAINT "REVIEW_PRODUCT_CUSTOMER_UNIQUE" UNIQUE ("product_id", "customer_id")
    )`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_REVIEW_PRODUCT" ON "product_review" ("product_id")`
  );

  // ── product_trust_badge (configurable from admin) ──
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "product_trust_badge" (
      "trust_badge_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "product_id" INT NOT NULL,
      "icon" VARCHAR(100) NOT NULL DEFAULT '🚚',
      "label" VARCHAR(255) NOT NULL,
      "sort_order" INT NOT NULL DEFAULT 0,
      CONSTRAINT "FK_TRUST_BADGE_PRODUCT" FOREIGN KEY ("product_id") REFERENCES "product" ("product_id") ON DELETE CASCADE
    )`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_TRUST_BADGE_PRODUCT" ON "product_trust_badge" ("product_id")`
  );

  // ── product_spec_badge (configurable from admin) ──
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "product_spec_badge" (
      "spec_badge_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "product_id" INT NOT NULL,
      "icon" VARCHAR(100) DEFAULT NULL,
      "value" VARCHAR(100) NOT NULL,
      "label" VARCHAR(255) NOT NULL,
      "sort_order" INT NOT NULL DEFAULT 0,
      CONSTRAINT "FK_SPEC_BADGE_PRODUCT" FOREIGN KEY ("product_id") REFERENCES "product" ("product_id") ON DELETE CASCADE
    )`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_SPEC_BADGE_PRODUCT" ON "product_spec_badge" ("product_id")`
  );
}
