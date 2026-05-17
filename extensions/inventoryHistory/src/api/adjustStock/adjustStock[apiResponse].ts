import {
  execute,
  select,
  update,
  startTransaction,
  commit,
  rollback
} from '@evershop/postgres-query-builder';
import { getConnection } from '@evershop/evershop/lib/postgres';

function escapeStr(s) {
  if (!s) return '';
  return s.replace(/'/g, "''");
}

export default async function adjustStock(request, response) {
  try {
    const { id } = request.params;
    const { qty_change, action, reason } = request.body;

    if (qty_change === undefined || qty_change === null || !action) {
      return response.status(400).json({
        error: {
          message: 'qty_change et action sont requis'
        }
      });
    }

    if (!['add', 'remove', 'set'].includes(action)) {
      return response.status(400).json({
        error: {
          message: "Action invalide. Utilisez 'add', 'remove' ou 'set'"
        }
      });
    }

    const change = parseInt(qty_change, 10);
    if (isNaN(change) || change < 0) {
      return response.status(400).json({
        error: {
          message: 'qty_change doit être un nombre positif'
        }
      });
    }

    const connection = await getConnection();
    await startTransaction(connection);

    try {
      // Find product by UUID
      const product = await select()
        .from('product')
        .where('uuid', '=', id)
        .load(connection);

      if (!product) {
        await rollback(connection);
        return response.status(404).json({
          error: { message: 'Produit introuvable' }
        });
      }

      // Get current inventory
      const inventory = await select()
        .from('product_inventory')
        .where('product_inventory_product_id', '=', product.product_id)
        .load(connection);

      if (!inventory) {
        await rollback(connection);
        return response.status(404).json({
          error: { message: 'Inventaire introuvable pour ce produit' }
        });
      }

      const currentQty = parseInt(inventory.qty, 10);
      let newQty;
      let actionType;

      switch (action) {
        case 'add':
          newQty = currentQty + change;
          actionType = 'stock_added';
          break;
        case 'remove':
          newQty = Math.max(currentQty - change, 0);
          actionType = 'stock_removed';
          break;
        case 'set':
          newQty = change;
          actionType =
            newQty > currentQty ? 'stock_adjusted_up' : 'stock_adjusted_down';
          break;
        default:
          newQty = currentQty;
          actionType = 'unknown';
      }

      const actualChange = newQty - currentQty;

      if (actualChange === 0) {
        await rollback(connection);
        return response.json({
          data: {
            qty: currentQty,
            previousQty: currentQty,
            change: 0,
            actionType: 'no_change',
            message: 'Aucun changement de stock'
          }
        });
      }

      // Set session variables for the DB trigger to pick up context
      const reasonText = escapeStr(
        reason || 'Ajustement manuel depuis le panneau admin'
      );
      await execute(
        connection,
        `SELECT set_config('app.inventory_action_type', '${escapeStr(actionType)}', true)`
      );
      await execute(
        connection,
        `SELECT set_config('app.inventory_reason', '${reasonText}', true)`
      );
      await execute(
        connection,
        `SELECT set_config('app.inventory_ref_type', 'admin_adjustment', true)`
      );
      await execute(
        connection,
        `SELECT set_config('app.inventory_admin_user', 'admin', true)`
      );

      // Update the inventory — the DB trigger will log the history automatically
      await update('product_inventory')
        .given({ qty: newQty })
        .where('product_inventory_product_id', '=', product.product_id)
        .execute(connection);

      await commit(connection);

      return response.json({
        data: {
          qty: newQty,
          previousQty: currentQty,
          change: actualChange,
          actionType,
          message: 'Stock mis à jour avec succès'
        }
      });
    } catch (err) {
      await rollback(connection);
      throw err;
    }
  } catch (error) {
    return response.status(500).json({
      error: {
        message: error.message || 'Erreur lors de la mise à jour du stock'
      }
    });
  }
}
