import { setContextValue } from '@evershop/evershop/graphql/services';

export default async (request: any, response: any, next: any) => {
  const { uuid, type, from } = request.query;
  if (uuid) setContextValue(request, 'editTemplateUuid', uuid);
  if (type) setContextValue(request, 'editTemplateType', type);
  if (from) setContextValue(request, 'editTemplateFrom', from);
  next();
};
