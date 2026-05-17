import { getAllowNegativeStock } from '../../../../../../modules/setting/services/setting.js';

export default {
  Product: {
    inventory: async (product) => {
      const allowNegative = await getAllowNegativeStock();
      return {
        ...product,
        qty: parseInt(product.qty, 10),
        isInStock: allowNegative
          ? true
          : (parseInt(product.qty, 10) > 0 && product.stockAvailability === true) ||
            product.manageStock === false
      };
    }
  }
};
