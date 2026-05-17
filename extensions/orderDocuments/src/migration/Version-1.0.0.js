import { execute } from '@evershop/postgres-query-builder';

export default async function Migration(connection) {
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "document_template" (
      "document_template_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
      "type" VARCHAR(30) NOT NULL,
      "name" VARCHAR(255) NOT NULL,
      "content" TEXT NOT NULL,
      "is_default" BOOLEAN NOT NULL DEFAULT FALSE,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "DOCUMENT_TEMPLATE_UUID_UNIQUE" UNIQUE ("uuid"),
      CONSTRAINT "CHECK_TEMPLATE_TYPE" CHECK ("type" IN ('facture', 'bon_commande', 'bon_livraison'))
    )`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_DOCUMENT_TEMPLATE_TYPE" ON "document_template" ("type")`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_DOCUMENT_TEMPLATE_DEFAULT" ON "document_template" ("is_default", "type")`
  );
}
