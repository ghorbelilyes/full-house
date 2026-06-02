import { execute } from '@evershop/postgres-query-builder';

export default async function Migration(connection) {
  // ── Reward segments table ──
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "spin_to_win_reward" (
      "reward_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
      "label" VARCHAR(255) NOT NULL,
      "reward_type" VARCHAR(50) NOT NULL DEFAULT 'no_win',
      "value" DECIMAL(12,4) NOT NULL DEFAULT 0,
      "probability" DECIMAL(5,2) NOT NULL DEFAULT 0,
      "coupon_prefix" VARCHAR(20) DEFAULT NULL,
      "coupon_expiry_days" INT DEFAULT 30,
      "min_order_amount" DECIMAL(12,4) DEFAULT 0,
      "max_usage" INT DEFAULT 1,
      "active" BOOLEAN NOT NULL DEFAULT TRUE,
      "sort_order" INT NOT NULL DEFAULT 0,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "STW_REWARD_UUID_UNIQUE" UNIQUE ("uuid"),
      CONSTRAINT "STW_REWARD_VALID_PROBABILITY" CHECK ("probability" >= 0 AND "probability" <= 100),
      CONSTRAINT "STW_REWARD_VALID_TYPE" CHECK ("reward_type" IN ('percentage_discount','fixed_discount','free_shipping','gift_product','no_win'))
    )`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_STW_REWARD_ACTIVE" ON "spin_to_win_reward" ("active")`
  );

  // ── Spin history table ──
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "spin_to_win_spin" (
      "spin_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
      "customer_id" INT DEFAULT NULL,
      "email" VARCHAR(255) DEFAULT NULL,
      "phone" VARCHAR(50) DEFAULT NULL,
      "ip_hash" VARCHAR(64) DEFAULT NULL,
      "user_agent_hash" VARCHAR(64) DEFAULT NULL,
      "reward_id" INT DEFAULT NULL,
      "coupon_code" VARCHAR(100) DEFAULT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "STW_SPIN_UUID_UNIQUE" UNIQUE ("uuid"),
      CONSTRAINT "FK_STW_SPIN_REWARD" FOREIGN KEY ("reward_id") REFERENCES "spin_to_win_reward" ("reward_id") ON DELETE SET NULL,
      CONSTRAINT "FK_STW_SPIN_CUSTOMER" FOREIGN KEY ("customer_id") REFERENCES "customer" ("customer_id") ON DELETE SET NULL
    )`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_STW_SPIN_CUSTOMER" ON "spin_to_win_spin" ("customer_id")`
  );
  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_STW_SPIN_EMAIL" ON "spin_to_win_spin" ("email")`
  );
  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_STW_SPIN_IP" ON "spin_to_win_spin" ("ip_hash")`
  );
  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_STW_SPIN_CREATED" ON "spin_to_win_spin" ("created_at")`
  );

  // ── Seed default rewards ──
  await execute(
    connection,
    `INSERT INTO "spin_to_win_reward" ("label","reward_type","value","probability","coupon_prefix","coupon_expiry_days","min_order_amount","max_usage","active","sort_order")
     VALUES
       ('5% réduction','percentage_discount',5,20,'STW5',30,0,1,true,1),
       ('10% réduction','percentage_discount',10,15,'STW10',30,0,1,true,2),
       ('Livraison gratuite','free_shipping',0,10,'STWFS',30,0,1,true,3),
       ('Cadeau surprise','gift_product',0,5,'STWGIFT',30,0,1,true,4),
       ('Essayez encore','no_win',0,30,'',0,0,0,true,5),
       ('15% réduction','percentage_discount',15,10,'STW15',30,50,1,true,6),
       ('Pas de chance','no_win',0,10,'',0,0,0,true,7)
    `
  );
}
