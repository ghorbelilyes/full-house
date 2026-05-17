import { translate } from '../../../../../lib/locale/translate/translate.js';
import { get } from '../../../../../lib/util/get.js';
import { EvershopRequest } from '../../../../../types/request.js';
import { setPageMetaInfo } from '../../../../cms/services/pageMetaInfo.js';

export default (request: EvershopRequest, response, next) => {
  const keyword = get(request, 'query.keyword');
  const promo = get(request, 'query.promo');

  if (keyword) {
    setPageMetaInfo(request, {
      title: translate('Search results for: ${keyword}', { keyword }),
      description: translate('Search results for: ${keyword}', { keyword })
    });
  } else if (promo === '1') {
    setPageMetaInfo(request, {
      title: translate('Promotions'),
      description: translate('Promotions')
    });
  } else {
    setPageMetaInfo(request, {
      title: translate('Shop'),
      description: translate('Shop')
    });
  }

  next();
};
