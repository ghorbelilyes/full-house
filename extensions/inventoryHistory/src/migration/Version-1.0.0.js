import { execute } from '@evershop/postgres-query-builder';

export default async function Migration(connection) {
  // ── product_inventory_history table ──
  // Records every stock movement for audit trail
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "product_inventory_history" (
      "history_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
      "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
      "product_id" INT NOT NULL,
      "action_type" VARCHAR(50) NOT NULL,
      "qty_before" INT NOT NULL DEFAULT 0,
      "qty_change" INT NOT NULL DEFAULT 0,
      "qty_after" INT NOT NULL DEFAULT 0,
      "reason" TEXT DEFAULT NULL,
      "reference_type" VARCHAR(50) DEFAULT NULL,
      "reference_id" VARCHAR(100) DEFAULT NULL,
      "admin_user" VARCHAR(255) DEFAULT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "INVENTORY_HISTORY_UUID_UNIQUE" UNIQUE ("uuid"),
      CONSTRAINT "FK_INVENTORY_HISTORY_PRODUCT" FOREIGN KEY ("product_id")
        REFERENCES "product" ("product_id") ON DELETE CASCADE
    )`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_INVENTORY_HISTORY_PRODUCT"
     ON "product_inventory_history" ("product_id")`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_INVENTORY_HISTORY_ACTION"
     ON "product_inventory_history" ("action_type")`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS "IDX_INVENTORY_HISTORY_CREATED"
     ON "product_inventory_history" ("created_at" DESC)`
  );

  // ── Trigger: automatically log every product_inventory change ──
  // This captures changes from ALL sources: admin edits, order placement
  // trigger, order cancellation restock, etc.
  await execute(
    connection,
    `CREATE OR REPLACE FUNCTION log_inventory_change()
     RETURNS TRIGGER
     LANGUAGE PLPGSQL
     AS $$
     DECLARE
       v_action_type VARCHAR(50);
       v_qty_change INT;
       v_reason TEXT;
       v_ref_type VARCHAR(50);
       v_ref_id VARCHAR(100);
     BEGIN
       v_qty_change := NEW.qty - OLD.qty;

       -- Skip if qty did not actually change
       IF v_qty_change = 0 THEN
         RETURN NEW;
       END IF;

       -- Determine action type based on context
       -- We use a session variable set by the application when available
       v_action_type := COALESCE(
         current_setting('app.inventory_action_type', true),
         CASE
           WHEN v_qty_change > 0 THEN 'stock_added'
           ELSE 'stock_removed'
         END
       );

       v_reason := current_setting('app.inventory_reason', true);
       v_ref_type := current_setting('app.inventory_ref_type', true);
       v_ref_id := current_setting('app.inventory_ref_id', true);

       INSERT INTO product_inventory_history (
         product_id, action_type, qty_before, qty_change, qty_after,
         reason, reference_type, reference_id, admin_user
       ) VALUES (
         NEW.product_inventory_product_id,
         v_action_type,
         OLD.qty,
         v_qty_change,
         NEW.qty,
         v_reason,
         v_ref_type,
         v_ref_id,
         current_setting('app.inventory_admin_user', true)
       );

       -- Reset session variables after logging
       PERFORM set_config('app.inventory_action_type', '', true);
       PERFORM set_config('app.inventory_reason', '', true);
       PERFORM set_config('app.inventory_ref_type', '', true);
       PERFORM set_config('app.inventory_ref_id', '', true);
       PERFORM set_config('app.inventory_admin_user', '', true);

       RETURN NEW;
     END;
     $$`
  );

  await execute(
    connection,
    `DROP TRIGGER IF EXISTS "TRIGGER_LOG_INVENTORY_CHANGE" ON "product_inventory"`
  );

  await execute(
    connection,
    `CREATE TRIGGER "TRIGGER_LOG_INVENTORY_CHANGE"
     AFTER UPDATE ON "product_inventory"
     FOR EACH ROW
     EXECUTE PROCEDURE log_inventory_change()`
  );

  // ── Also log initial stock when product_inventory row is first inserted ──
  await execute(
    connection,
    `CREATE OR REPLACE FUNCTION log_inventory_initial()
     RETURNS TRIGGER
     LANGUAGE PLPGSQL
     AS $$
     BEGIN
       IF NEW.qty != 0 THEN
         INSERT INTO product_inventory_history (
           product_id, action_type, qty_before, qty_change, qty_after,
           reason, reference_type, admin_user
         ) VALUES (
           NEW.product_inventory_product_id,
           'initial_stock',
           0,
           NEW.qty,
           NEW.qty,
           'Stock initial à la création du produit',
           'product_creation',
           current_setting('app.inventory_admin_user', true)
         );
       END IF;
       RETURN NEW;
     END;
     $$`
  );

  await execute(
    connection,
    `DROP TRIGGER IF EXISTS "TRIGGER_LOG_INVENTORY_INITIAL" ON "product_inventory"`
  );

  await execute(
    connection,
    `CREATE TRIGGER "TRIGGER_LOG_INVENTORY_INITIAL"
     AFTER INSERT ON "product_inventory"
     FOR EACH ROW
     EXECUTE PROCEDURE log_inventory_initial()`
  );
}
