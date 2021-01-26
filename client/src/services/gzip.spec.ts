import * as fs from 'fs';
import * as zlib from 'zlib';
import { gzip } from './gzip';

describe('gzip', () => {
  const uncompressedFilepath = '/tmp/file.txt';
  const compressedFilepath = '/tmp/file.txt.gz';
  const content = 'Hello World!\n';

  beforeAll(async () => {
    fs.writeFileSync(uncompressedFilepath, content, {encoding: 'utf-8'});
    await gzip(uncompressedFilepath, compressedFilepath);
  });

  afterAll(() => {
    fs.rmdirSync(uncompressedFilepath);
    fs.rmdirSync(compressedFilepath);
  });

  test('zipped content matches', async () => {
    expect(zlib.gunzipSync(fs.readFileSync(compressedFilepath)).toString()).toEqual(content);
  });
});
