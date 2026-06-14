import {
  getBrandStoreDescriptionFallback,
  getBrandStoreNameFallback
} from '../../../../../lib/branding/getBrandConfig.js';
import { getSetting } from '../../../../setting/services/setting.js';
import { setPageMetaInfo } from '../../../services/pageMetaInfo.js';

export default async (request, response, next) => {
  setPageMetaInfo(request, {
    title: await getSetting('storeName', getBrandStoreNameFallback()),
    description: await getSetting(
      'storeDescription',
      getBrandStoreDescriptionFallback()
    )
  });
  next();
};
