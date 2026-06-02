import { pool } from '@evershop/evershop/lib/postgres';
import {
  setModuleEnabled,
  isModuleAvailableInContract,
  getAllModulesForAdmin
} from '../../services/moduleRegistry.js';

export default async function saveModuleConfig(request, response) {
  const { code, enabled } = request.body;

  if (!code || typeof enabled !== 'boolean') {
    return response.status(400).json({
      error: {
        message: 'Les champs « code » et « enabled » (boolean) sont requis.'
      }
    });
  }

  if (!isModuleAvailableInContract(code)) {
    return response.status(403).json({
      error: {
        code: 'CONTRACT_LOCKED',
        message: 'Ce module n\'est pas inclus dans votre contrat.'
      }
    });
  }

  const success = await setModuleEnabled(code, enabled, pool);
  if (!success) {
    return response.status(400).json({
      error: { message: 'Impossible de modifier ce module.' }
    });
  }

  const data = await getAllModulesForAdmin(pool);
  return response.json({ success: true, data });
}
