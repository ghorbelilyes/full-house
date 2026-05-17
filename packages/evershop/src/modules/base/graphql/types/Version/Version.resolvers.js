import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { error } from '../../../../../lib/log/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
let version = 'unknown';
try {
  const pkgPath = resolve(__dirname, '../../../../../../package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  version = pkg.version;
} catch (e) {
  // ignore
}

export default {
  Query: {
    version: () => {
      try {
        return version;
      } catch (e) {
        error(e);
        return 'unknown';
      }
    }
  }
};
