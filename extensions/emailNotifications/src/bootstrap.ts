import { registerEmailService } from '@evershop/evershop/lib/mail/emailHelper';
import { error } from '@evershop/evershop/lib/log';
import { addProcessor } from '@evershop/evershop/lib/util/registry';
import { hookAfter, hookBefore } from '@evershop/evershop/lib/util/hookable';
import { prepareCoreEmailArguments } from './services/coreEmailArguments.js';
import { sendPreparedEmailArguments } from './services/emailService.js';

async function insertEvent(
  connection: { query: Function },
  name: string,
  data: Record<string, any>
) {
  await connection.query(
    'INSERT INTO event (name, data) VALUES ($1, $2)',
    [name, JSON.stringify(data)]
  );
}

export default async () => {
  registerEmailService({
    sendEmail: sendPreparedEmailArguments
  });

  addProcessor(
    'orderConfirmationEmailArguments',
    async function prepareOrderConfirmation(args) {
      return await prepareCoreEmailArguments(
        'order_placed_customer',
        args,
        this as Record<string, any>
      );
    },
    900
  );

  addProcessor(
    'customerWelcomeEmailArguments',
    async function prepareCustomerWelcome(args) {
      return await prepareCoreEmailArguments(
        'customer_registered',
        args,
        this as Record<string, any>
      );
    },
    900
  );

  addProcessor(
    'resetPasswordEmailArguments',
    async function prepareResetPassword(args) {
      return await prepareCoreEmailArguments(
        'reset_password',
        args,
        this as Record<string, any>
      );
    },
    900
  );

  hookBefore(
    'changePaymentStatus',
    async function rememberPreviousPaymentStatus(orderId, _status, connection) {
      try {
        const result = await connection.query(
          'SELECT payment_status FROM "order" WHERE order_id = $1',
          [orderId]
        );
        this.previousPaymentStatus = result.rows[0]?.payment_status || '';
      } catch (e) {
        error(e);
      }
    },
    20
  );

  hookAfter(
    'changePaymentStatus',
    async function emitPaymentStatusUpdated(_result, orderId, status, connection) {
      try {
        if (this.previousPaymentStatus === status) {
          return;
        }
        await insertEvent(connection, 'payment_status_updated', {
          orderId,
          before: this.previousPaymentStatus || '',
          after: status
        });
      } catch (e) {
        error(e);
      }
    },
    20
  );

  hookAfter(
    'createShipment',
    async function emitShipmentCreated(result, orderId, carrier, trackingNumber, connection) {
      try {
        await insertEvent(connection, 'shipment_created', {
          orderId,
          shipmentId: result?.insertId || result?.shipment_id,
          carrier: carrier || '',
          trackingNumber: trackingNumber || ''
        });
      } catch (e) {
        error(e);
      }
    },
    20
  );

  // Default templates are seeded lazily by the API/send path after migrations.
};
