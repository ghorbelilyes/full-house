import {
  isModuleEnabled,
  getAllModuleStatuses,
  getAllModulesForAdmin
} from '../../../services/moduleRegistry.js';

export default {
  Query: {
    moduleEnabled: async (_, { code }, { pool }) => {
      return isModuleEnabled(code, pool);
    },

    allModuleStatuses: async (_, __, { pool }) => {
      const statuses = await getAllModuleStatuses(pool);
      return Object.entries(statuses).map(([code, enabled]) => ({
        code,
        enabled
      }));
    },

    moduleManager: async (_, __, { pool }) => {
      return getAllModulesForAdmin(pool);
    }
  }
};
