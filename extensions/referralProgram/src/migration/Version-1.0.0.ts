import { execute } from '@evershop/postgres-query-builder';

export default async function Migration(connection) {
  // ── Referral codes table ──
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "referral_code" (
      "referral_code_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
      "customer_id" INT NOT NULL,
      "code" VARCHAR(20) NOT NULL,
      "active" BOOLEAN NOT NULL DEFAULT TRUE,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "REF_CODE_UUID_UNIQUE" UNIQUE ("uuid"),
      CONSTRAINT "REF_CODE_UNIQUE" UNIQUE ("code"),
      CONSTRAINT "REF_CODE_CUSTOMER_UNIQUE" UNIQUE ("customer_id"),
      CONSTRAINT "FK_REF_CODE_CUSTOMER" FOREIGN KEY ("customer_id") REFERENCES "customer" ("customer_id") ON DELETE CASCADE
    )`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_REF_CODE_CODE" ON "referral_code" ("code")`
  );

  // ── Referral visits table ──
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "referral_visit" (
      "visit_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "referral_code_id" INT NOT NULL,
      "ip_hash" VARCHAR(64) DEFAULT NULL,
      "user_agent_hash" VARCHAR(64) DEFAULT NULL,
      "landing_page" VARCHAR(500) DEFAULT '/',
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "FK_REF_VISIT_CODE" FOREIGN KEY ("referral_code_id") REFERENCES "referral_code" ("referral_code_id") ON DELETE CASCADE
    )`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_REF_VISIT_CODE" ON "referral_visit" ("referral_code_id")`
  );

  // ── Referrals table ──
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "referral" (
      "referral_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
      "referrer_customer_id" INT NOT NULL,
      "referred_customer_id" INT DEFAULT NULL,
      "referred_email" VARCHAR(255) DEFAULT NULL,
      "order_id" INT DEFAULT NULL,
      "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "validated_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
      CONSTRAINT "REF_UUID_UNIQUE" UNIQUE ("uuid"),
      CONSTRAINT "REF_STATUS_CHECK" CHECK ("status" IN ('pending','validated','rejected','rewarded')),
      CONSTRAINT "FK_REF_REFERRER" FOREIGN KEY ("referrer_customer_id") REFERENCES "customer" ("customer_id") ON DELETE CASCADE,
      CONSTRAINT "FK_REF_REFERRED" FOREIGN KEY ("referred_customer_id") REFERENCES "customer" ("customer_id") ON DELETE SET NULL
    )`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_REF_REFERRER" ON "referral" ("referrer_customer_id")`
  );
  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_REF_REFERRED" ON "referral" ("referred_customer_id")`
  );
  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_REF_STATUS" ON "referral" ("status")`
  );

  // ── Referral rewards table ──
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "referral_reward" (
      "reward_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
      "referral_id" INT NOT NULL,
      "customer_id" INT NOT NULL,
      "reward_type" VARCHAR(50) NOT NULL DEFAULT 'percentage_discount',
      "reward_value" DECIMAL(12,4) DEFAULT 0,
      "coupon_code" VARCHAR(100) DEFAULT NULL,
      "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "expires_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
      CONSTRAINT "REF_REWARD_UUID_UNIQUE" UNIQUE ("uuid"),
      CONSTRAINT "REF_REWARD_STATUS_CHECK" CHECK ("status" IN ('pending','available','used','expired')),
      CONSTRAINT "FK_REF_REWARD_REFERRAL" FOREIGN KEY ("referral_id") REFERENCES "referral" ("referral_id") ON DELETE CASCADE,
      CONSTRAINT "FK_REF_REWARD_CUSTOMER" FOREIGN KEY ("customer_id") REFERENCES "customer" ("customer_id") ON DELETE CASCADE
    )`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_REF_REWARD_REFERRAL" ON "referral_reward" ("referral_id")`
  );
  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_REF_REWARD_CUSTOMER" ON "referral_reward" ("customer_id")`
  );
  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_REF_REWARD_STATUS" ON "referral_reward" ("status")`
  );
}
