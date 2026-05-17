import {
  commit,
  execute,
  rollback,
  select,
  startTransaction
} from '@evershop/postgres-query-builder';
import { getConnection } from '@evershop/evershop/lib/postgres';
import {
  addOrderActivityLog,
  updatePaymentStatus,
  updateShipmentStatus
} from '@evershop/evershop/oms/services';

type OrderReturnReceiveInput = {
  reason?: string;
  markRefunded?: boolean;
};

const manuallyRefundableStatuses = new Set(['paid', 'refund_pending']);
const providerManagedPaymentMethods = new Set(['stripe', 'paypal']);

async function addReturnEvent(
  connection: any,
  name: string,
  data: Record<string, unknown>
) {
  await connection.query('INSERT INTO event (name, data) VALUES ($1, $2)', [
    name,
    JSON.stringify(data)
  ]);
}

async function setInventoryContext(
  connection: any,
  orderId: number,
  reason: string
) {
  await connection.query(
    "SELECT set_config('app.inventory_action_type', $1, true)",
    ['order_returned']
  );
  await connection.query("SELECT set_config('app.inventory_reason', $1, true)", [
    reason
  ]);
  await connection.query(
    "SELECT set_config('app.inventory_ref_type', $1, true)",
    ['order_return']
  );
  await connection.query("SELECT set_config('app.inventory_ref_id', $1, true)", [
    String(orderId)
  ]);
}

async function restockReturnedOrder(
  orderId: number,
  connection: any
) {
  const orderItems = await select()
    .from('order_item')
    .where('order_item_order_id', '=', orderId)
    .execute(connection, false);

  for (const orderItem of orderItems) {
    await setInventoryContext(
      connection,
      orderId,
      `Retour reçu pour la commande #${orderId}`
    );
    await execute(
      connection,
      `UPDATE product_inventory
       SET qty = qty + ${Number(orderItem.qty)}
       WHERE product_inventory_product_id = ${Number(orderItem.product_id)}
         AND manage_stock = TRUE`
    );
  }
}

function canMarkManualRefund(order) {
  return (
    manuallyRefundableStatuses.has(order.payment_status) &&
    !providerManagedPaymentMethods.has(order.payment_method)
  );
}

export async function requestOrderReturn(uuid: string, reason?: string) {
  const connection = await getConnection();
  await startTransaction(connection);
  try {
    const order = await select()
      .from('order')
      .where('uuid', '=', uuid)
      .load(connection, false);

    if (!order) {
      throw new Error('Commande introuvable');
    }
    if (order.status === 'canceled') {
      throw new Error('Une commande annulée ne peut pas être retournée');
    }
    if (order.shipment_status === 'return_requested') {
      throw new Error('Un retour est déjà demandé pour cette commande');
    }
    if (order.shipment_status === 'returned') {
      throw new Error('Cette commande est déjà marquée comme retournée');
    }
    if (order.shipment_status !== 'delivered') {
      throw new Error(
        'Le retour est disponible uniquement après livraison de la commande'
      );
    }

    await updateShipmentStatus(order.order_id, 'return_requested', connection);

    if (order.payment_status === 'paid' && order.payment_method !== 'stripe') {
      await updatePaymentStatus(order.order_id, 'refund_pending', connection);
    }

    const comment = reason
      ? `Retour demandé (${reason})`
      : 'Retour demandé';
    await addOrderActivityLog(order.order_id, comment, false, connection);
    await addReturnEvent(connection, 'order_return_requested', {
      orderId: order.order_id,
      reason: reason || '',
      paymentStatus: order.payment_status,
      shipmentStatus: order.shipment_status
    });

    await commit(connection);
    return { orderId: order.order_id };
  } catch (error) {
    await rollback(connection);
    throw error;
  }
}

export async function receiveOrderReturn(
  uuid: string,
  input: OrderReturnReceiveInput = {}
) {
  const connection = await getConnection();
  await startTransaction(connection);
  try {
    const order = await select()
      .from('order')
      .where('uuid', '=', uuid)
      .load(connection, false);

    if (!order) {
      throw new Error('Commande introuvable');
    }
    if (order.shipment_status === 'returned') {
      throw new Error('Cette commande est déjà marquée comme retournée');
    }
    if (order.shipment_status !== 'return_requested') {
      throw new Error('Le retour doit être demandé avant réception');
    }

    await updateShipmentStatus(order.order_id, 'returned', connection);
    await restockReturnedOrder(order.order_id, connection);

    if (input.markRefunded) {
      if (!canMarkManualRefund(order)) {
        throw new Error(
          'Ce paiement doit être remboursé depuis son module de paiement'
        );
      }
      await updatePaymentStatus(order.order_id, 'refunded', connection);
    }

    const comment = input.reason
      ? `Retour reçu (${input.reason})`
      : 'Retour reçu et stock remis à jour';
    await addOrderActivityLog(order.order_id, comment, false, connection);
    await addReturnEvent(connection, 'order_return_received', {
      orderId: order.order_id,
      reason: input.reason || '',
      markRefunded: input.markRefunded === true
    });

    await commit(connection);
    return { orderId: order.order_id };
  } catch (error) {
    await rollback(connection);
    throw error;
  }
}
