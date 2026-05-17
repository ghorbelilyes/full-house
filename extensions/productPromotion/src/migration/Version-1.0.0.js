// Migration: create product_promotion table
import { execute } from '@evershop/postgres-query-builder';

export default async function Migration(connection) {
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "product_promotion" (
      "product_promotion_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
      "product_id" INT NOT NULL,
      "promotion_type" VARCHAR(20) NOT NULL DEFAULT 'percentage',
      "promotion_value" DECIMAL(12,4) NOT NULL DEFAULT 0,
      "promotion_label" VARCHAR(255) DEFAULT NULL,
      "start_date" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
      "end_date" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
      "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PRODUCT_PROMOTION_UUID_UNIQUE" UNIQUE ("uuid"),
      CONSTRAINT "FK_PRODUCT_PROMOTION_PRODUCT" FOREIGN KEY ("product_id") REFERENCES "product" ("product_id") ON DELETE CASCADE,
      CONSTRAINT "PRODUCT_PROMOTION_PRODUCT_UNIQUE" UNIQUE ("product_id"),
      CONSTRAINT "CHECK_PROMOTION_TYPE" CHECK ("promotion_type" IN ('percentage', 'fixed')),
      CONSTRAINT "CHECK_PROMOTION_VALUE" CHECK ("promotion_value" >= 0)
    )`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_PRODUCT_PROMOTION_PRODUCT" ON "product_promotion" ("product_id")`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_PRODUCT_PROMOTION_ENABLED" ON "product_promotion" ("enabled")`
  );
}
