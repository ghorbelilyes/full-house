// Migration: add badge_size column to product_spec_badge
import { execute } from '@evershop/postgres-query-builder';

export default async function Migration(connection) {
  await execute(
    connection,
    `ALTER TABLE "product_spec_badge"
       ADD COLUMN IF NOT EXISTS "badge_size" VARCHAR(4) NOT NULL DEFAULT 'md'`
  );
}
