import * as fs from 'fs';
import * as zlib from 'zlib';

export const gzip = async (uncompressedFilepath: string, compressedFilepath: string): Promise<void> => {
  const r = fs.createReadStream(uncompressedFilepath);
  const z = zlib.createGzip();
  const w = fs.createWriteStream(compressedFilepath);
  return new Promise((resolve, reject) => {
    r.pipe(z).pipe(w).on('close', resolve).on('error', reject);
  });
};
