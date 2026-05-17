export default {
  Setting: {
    headerBarEnabled: (setting) => {
      const row = setting.find((s) => s.name === 'headerBarEnabled');
      if (row) {
        return row.value === '1' || row.value === 'true' || row.value === true;
      }
      return false;
    },
    headerBarMessages: (setting) => {
      const row = setting.find((s) => s.name === 'headerBarMessages');
      if (!row) return [];
      try {
        const parsed = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        if (Array.isArray(parsed)) return parsed;
        return [];
      } catch {
        return [];
      }
    }
  }
};
