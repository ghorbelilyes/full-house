// Migration: widen icon column to TEXT for SVG support
import { execute } from '@evershop/postgres-query-builder';

export default async function Migration(connection) {
  await execute(
    connection,
    `ALTER TABLE "product_spec_badge" ALTER COLUMN "icon" TYPE TEXT`
  );
  await execute(
    connection,
    `ALTER TABLE "product_trust_badge" ALTER COLUMN "icon" TYPE TEXT`
  );
}
