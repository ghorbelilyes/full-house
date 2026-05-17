import { pool } from '@evershop/evershop/lib/postgres';
import { error } from '@evershop/evershop/lib/log';

export default async function rememberTracking(request, response, next) {
  try {
    const { shipment_id } = request.params;
    const result = await pool.query(
      'SELECT * FROM shipment WHERE uuid = $1',
      [shipment_id]
    );
    request.locals = request.locals || {};
    request.locals.emailNotificationsPreviousShipment = result.rows[0] || null;
  } catch (e) {
    error(e);
  }
  next();
}
