import { getSetting } from '../../../../setting/services/setting.js';
import { setPageMetaInfo } from '../../../services/pageMetaInfo.js';

export default async (request, response, next) => {
  setPageMetaInfo(request, {
    title: await getSetting('storeName', 'Full House'),
    description: await getSetting(
      'storeDescription',
      'Full House - Electricity & Security'
    )
  });
  next();
};
