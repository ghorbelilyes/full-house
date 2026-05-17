import { execute } from '@evershop/postgres-query-builder';

export default async function Migration(connection) {
  // ── wishlist table ──
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "wishlist" (
      "wishlist_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
      "sid" VARCHAR(255) DEFAULT NULL,
      "customer_id" INT DEFAULT NULL,
      "customer_email" VARCHAR(255) DEFAULT NULL,
      "customer_full_name" VARCHAR(255) DEFAULT NULL,
      "status" SMALLINT NOT NULL DEFAULT 1,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WISHLIST_UUID_UNIQUE" UNIQUE ("uuid")
    )`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_WISHLIST_SID" ON "wishlist" ("sid")`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_WISHLIST_CUSTOMER" ON "wishlist" ("customer_id")`
  );

  // ── wishlist_item table ──
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "wishlist_item" (
      "wishlist_item_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
      "wishlist_id" INT NOT NULL,
      "product_id" INT NOT NULL,
      "product_sku" VARCHAR(255) DEFAULT NULL,
      "product_name" VARCHAR(255) DEFAULT NULL,
      "thumbnail" VARCHAR(255) DEFAULT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WISHLIST_ITEM_UUID_UNIQUE" UNIQUE ("uuid"),
      CONSTRAINT "FK_WISHLIST_ITEM_WISHLIST" FOREIGN KEY ("wishlist_id") REFERENCES "wishlist" ("wishlist_id") ON DELETE CASCADE,
      CONSTRAINT "FK_WISHLIST_ITEM_PRODUCT" FOREIGN KEY ("product_id") REFERENCES "product" ("product_id") ON DELETE CASCADE,
      CONSTRAINT "WISHLIST_ITEM_UNIQUE_PRODUCT" UNIQUE ("wishlist_id", "product_id")
    )`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_WISHLIST_ITEM_WISHLIST" ON "wishlist_item" ("wishlist_id")`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_WISHLIST_ITEM_PRODUCT" ON "wishlist_item" ("product_id")`
  );
}
