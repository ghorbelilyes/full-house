import { select } from '@evershop/postgres-query-builder';

const ACTION_LABELS = {
  initial_stock: 'Stock initial',
  stock_added: 'Ajout de stock',
  stock_removed: 'Retrait de stock',
  stock_adjusted_up: 'Ajustement (hausse)',
  stock_adjusted_down: 'Ajustement (baisse)',
  order_placed: 'Commande passée',
  order_canceled: 'Commande annulée',
  admin_edit: 'Modification admin'
};

export default {
  Inventory: {
    history: async (inventory) => {
      if (!inventory.product_id) {
        return [];
      }
      const rows = await select()
        .from('product_inventory_history')
        .where('product_id', '=', inventory.product_id)
        .orderBy('created_at', 'DESC')
        .limit(0, 50)
        .execute(null);

      return rows.map((row) => ({
        historyId: row.history_id,
        uuid: row.uuid,
        productId: row.product_id,
        actionType: row.action_type,
        actionLabel: ACTION_LABELS[row.action_type] || row.action_type,
        qtyBefore: row.qty_before,
        qtyChange: row.qty_change,
        qtyAfter: row.qty_after,
        reason: row.reason || null,
        referenceType: row.reference_type || null,
        referenceId: row.reference_id || null,
        adminUser: row.admin_user || null,
        createdAt: row.created_at
          ? new Date(row.created_at).toISOString()
          : null
      }));
    }
  }
};
