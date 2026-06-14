import { getBrandConfig } from '../../../../../lib/branding/getBrandConfig.js';

export default {
  Query: {
    brandConfig: () => getBrandConfig()
  }
};
