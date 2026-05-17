/**
 * Downloads an external image to the local media folder and returns the local path.
 * Images are stored in /media/ai-description/<hash>.<ext>
 */
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { createHash } from 'crypto';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

const MEDIA_DIR = join(process.cwd(), 'media', 'ai-description');
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB max per image
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
const TIMEOUT_MS = 15_000;

export async function downloadImage(
  imageUrl: string
): Promise<string | null> {
  try {
    // Ensure directory exists
    if (!existsSync(MEDIA_DIR)) {
      mkdirSync(MEDIA_DIR, { recursive: true });
    }

    // Determine filename from URL hash
    const hash = createHash('sha256').update(imageUrl).digest('hex').slice(0, 16);
    let ext = extname(new URL(imageUrl).pathname).toLowerCase().split('?')[0];
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      ext = '.jpg'; // default
    }
    const filename = `${hash}${ext}`;
    const localPath = join(MEDIA_DIR, filename);
    const publicPath = `/media/ai-description/${filename}`;

    // Skip if already downloaded
    if (existsSync(localPath)) {
      return publicPath;
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'image/*'
      },
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timer);

    if (!res.ok || !res.body) {
      return null;
    }

    // Check content length
    const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_SIZE) {
      return null;
    }

    // Check content type
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return null;
    }

    // Stream to file
    const nodeStream = Readable.fromWeb(res.body as any);
    const fileStream = createWriteStream(localPath);
    await pipeline(nodeStream, fileStream);

    return publicPath;
  } catch {
    return null;
  }
}

/**
 * Downloads multiple images and returns only the successful local paths.
 */
export async function downloadImages(
  imageUrls: string[],
  maxCount: number = 10
): Promise<string[]> {
  const urls = imageUrls.slice(0, maxCount);
  const results = await Promise.allSettled(urls.map(downloadImage));
  return results
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter((path): path is string => path !== null);
}
