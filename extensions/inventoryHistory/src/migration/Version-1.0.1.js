import { execute } from '@evershop/postgres-query-builder';

export default async function Migration(connection) {
  // Update the order item trigger to also set session variables for inventory history
  await execute(
    connection,
    `CREATE OR REPLACE FUNCTION reduce_product_stock_when_order_placed()
        RETURNS TRIGGER
        LANGUAGE PLPGSQL
        AS
      $$
      BEGIN
        -- Set session variables for inventory history trigger
        PERFORM set_config('app.inventory_action_type', 'order_placed', true);
        PERFORM set_config('app.inventory_reason', 'Commande #' || NEW.order_item_order_id, true);
        PERFORM set_config('app.inventory_ref_type', 'order', true);
        PERFORM set_config('app.inventory_ref_id', NEW.order_item_order_id::text, true);

        UPDATE product_inventory
        SET qty = qty - NEW.qty
        WHERE product_inventory_product_id = NEW.product_id
          AND manage_stock = TRUE;
        RETURN NEW;
      END
      $$;`
  );
}
