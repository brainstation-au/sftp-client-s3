import * as fs from 'fs';
import * as zlib from 'zlib';

export const compress = async (uncompressedFilepath: string, compressedFilepath: string): Promise<void> => {
  const r = fs.createReadStream(uncompressedFilepath);
  const z = zlib.createGzip();
  const w = fs.createWriteStream(compressedFilepath);
  return new Promise((resolve, reject) => {
    r.pipe(z).pipe(w).on('close', resolve).on('error', reject);
  });
};

export const uncompress = async (compressedFilepath: string, uncompressedFilepath: string): Promise<void> => {
  const r = fs.createReadStream(compressedFilepath);
  const z = zlib.createGunzip();
  const w = fs.createWriteStream(uncompressedFilepath);
  return new Promise((resolve, reject) => {
    r.pipe(z).pipe(w).on('close', resolve).on('error', reject);
  });
};
