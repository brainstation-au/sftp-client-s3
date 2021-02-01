import * as fs from 'fs';
import * as zlib from 'zlib';
import { compress, uncompress } from './gzip';

describe('gzip', () => {
  describe('compress', () => {
    const uncompressedFilepath = '/tmp/file.txt';
    const compressedFilepath = '/tmp/file.txt.gz';
    const content = 'Hello World!\n';

    beforeAll(async () => {
      fs.writeFileSync(uncompressedFilepath, content, {encoding: 'utf-8'});
      await compress(uncompressedFilepath, compressedFilepath);
    });

    afterAll(() => {
      fs.unlinkSync(uncompressedFilepath);
      fs.unlinkSync(compressedFilepath);
    });

    test('zipped content matches', async () => {
      expect(zlib.gunzipSync(fs.readFileSync(compressedFilepath)).toString()).toEqual(content);
    });
  });

  describe('uncompress', () => {
    const uncompressedFilepath = '/tmp/file.txt';
    const compressedFilepath = '/tmp/file.txt.gz';
    const content = 'Hello World!\n';

    beforeAll(async () => {
      fs.writeFileSync(compressedFilepath, zlib.gzipSync(content));
      await uncompress(compressedFilepath, uncompressedFilepath);
    });

    afterAll(() => {
      fs.unlinkSync(uncompressedFilepath);
      fs.unlinkSync(compressedFilepath);
    });

    test('zipped content matches', () => {
      expect(fs.readFileSync(uncompressedFilepath, 'utf-8')).toEqual(content);
    });
  });
});
