import { translate } from '../../../../../lib/locale/translate/translate.js';
import { EvershopRequest } from '../../../../../types/request.js';
import { setPageMetaInfo } from '../../../../cms/services/pageMetaInfo.js';

export default (request: EvershopRequest, response, next) => {
  setPageMetaInfo(request, {
    title: translate('Boutique'),
    description: translate('Parcourez toutes nos catégories')
  });
  next();
};
