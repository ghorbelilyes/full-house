import { setContextValue } from '../../../../graphql/services/contextHelper.js';

export default async (request, response, next) => {
  setContextValue(request, 'pageInfo', {
    title: 'Paramètres du stock',
    description: 'Gérer les paramètres de stock et d\'inventaire'
  });
  next();
};
