import { execute } from '@evershop/postgres-query-builder';

export default async function Migration(connection) {
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "module_config" (
      "module_config_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "code" VARCHAR(100) NOT NULL,
      "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MODULE_CONFIG_CODE_UNIQUE" UNIQUE ("code")
    )`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_MODULE_CONFIG_CODE" ON "module_config" ("code")`
  );
}
