import fs from 'fs/promises';
import { join } from 'path';
import staticMiddleware from 'serve-static';
import { EvershopRequest } from '../../types/request.js';
import { EvershopResponse } from '../../types/response.js';
import { CONSTANTS } from '../helpers.js';

const BRANDING_PREFIX = '/branding/';

export default async function brandingPublicStatic(
  request: EvershopRequest,
  response: EvershopResponse,
  next
) {
  const { path } = request;

  try {
    if (!path.startsWith(BRANDING_PREFIX) || !path.includes('.')) {
      throw new Error('Not a branding asset request');
    }

    const assetPath = path.replace(BRANDING_PREFIX, '');
    const test = await fs.stat(join(CONSTANTS.BRANDINGPATH, 'assets', assetPath));
    if (test.isFile()) {
      const originalUrl = request.url;
      request.url = request.url.replace('/branding', '') || '/';
      staticMiddleware(join(CONSTANTS.BRANDINGPATH, 'assets'), {
        fallthrough: false
      })(request, response, (error) => {
        request.url = originalUrl;
        next(error);
      });
      return;
    }
  } catch (e) {
    next();
    return;
  }

  next();
}
