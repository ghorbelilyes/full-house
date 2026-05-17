export default {
  Setting: {
    whatsappEnabled: (setting) => {
      const row = setting.find((s) => s.name === 'whatsappEnabled');
      if (row) {
        return row.value === '1' || row.value === 'true';
      }
      return false;
    },
    whatsappNumber: (setting) => {
      const row = setting.find((s) => s.name === 'whatsappNumber');
      return row ? row.value : null;
    },
    whatsappMessageTemplate: (setting) => {
      const row = setting.find((s) => s.name === 'whatsappMessageTemplate');
      return row ? row.value : null;
    }
  }
};
