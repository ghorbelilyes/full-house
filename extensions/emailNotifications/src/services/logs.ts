import { pool } from '@evershop/evershop/lib/postgres';
import { NotificationType } from './constants.js';

export type EmailLogInput = {
  notificationType: NotificationType | string;
  eventKey?: string;
  recipient: string;
  provider?: string;
  relatedOrderId?: number | null;
  relatedCustomerId?: number | null;
  metadata?: Record<string, any>;
};

function toLog(row: Record<string, any>) {
  return {
    id: row.email_notification_log_id,
    notificationType: row.notification_type,
    eventKey: row.event_key,
    recipient: row.recipient,
    provider: row.provider,
    status: row.status,
    errorMessage: row.error_message,
    attempts: row.attempts,
    relatedOrderId: row.related_order_id,
    relatedCustomerId: row.related_customer_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function reserveEmailLog(input: EmailLogInput) {
  if (input.eventKey) {
    const existing = await pool.query(
      `SELECT email_notification_log_id, status
        FROM email_notification_log
        WHERE event_key = $1`,
      [input.eventKey]
    );
    if (existing.rows[0]?.status === 'success') {
      return {
        shouldSend: false,
        logId: existing.rows[0].email_notification_log_id
      };
    }
  }

  const result = await pool.query(
    `INSERT INTO email_notification_log
      (notification_type, event_key, recipient, provider, status, attempts,
        related_order_id, related_customer_id, metadata, updated_at)
      VALUES ($1, $2, $3, $4, 'pending', 1, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (event_key)
      WHERE event_key IS NOT NULL
      DO UPDATE SET
        recipient = EXCLUDED.recipient,
        provider = EXCLUDED.provider,
        status = 'pending',
        error_message = NULL,
        attempts = email_notification_log.attempts + 1,
        metadata = EXCLUDED.metadata,
        updated_at = CURRENT_TIMESTAMP
      RETURNING email_notification_log_id`,
    [
      input.notificationType,
      input.eventKey || null,
      input.recipient,
      input.provider || null,
      input.relatedOrderId || null,
      input.relatedCustomerId || null,
      input.metadata ? JSON.stringify(input.metadata) : null
    ]
  );

  return {
    shouldSend: true,
    logId: result.rows[0].email_notification_log_id
  };
}

export async function markEmailLogSuccess(logId: number) {
  await pool.query(
    `UPDATE email_notification_log
      SET status = 'success', error_message = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE email_notification_log_id = $1`,
    [logId]
  );
}

export async function markEmailLogFailure(logId: number, error: unknown) {
  const message =
    error instanceof Error ? error.message : String(error || 'Erreur inconnue');
  await pool.query(
    `UPDATE email_notification_log
      SET status = 'failed', error_message = $2, updated_at = CURRENT_TIMESTAMP
      WHERE email_notification_log_id = $1`,
    [logId, message.slice(0, 1000)]
  );
}

export async function getRecentEmailLogs(limit = 25) {
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const result = await pool.query(
    `SELECT *
      FROM email_notification_log
      ORDER BY created_at DESC
      LIMIT $1`,
    [safeLimit]
  );
  return result.rows.map(toLog);
}
