import * as fs from 'fs';
import * as zlib from 'zlib';
import { gunzip } from './gunzip';

describe('gunzip', () => {
  const uncompressedFilepath = '/tmp/file.txt';
  const compressedFilepath = '/tmp/file.txt.gz';
  const content = 'Hello World!\n';

  beforeAll(async () => {
    fs.writeFileSync(compressedFilepath, zlib.gzipSync(content));
    await gunzip(compressedFilepath, uncompressedFilepath);
  });

  afterAll(() => {
    fs.rmdirSync(uncompressedFilepath);
    fs.rmdirSync(compressedFilepath);
  });

  test('zipped content matches', () => {
    expect(fs.readFileSync(uncompressedFilepath, 'utf-8')).toEqual(content);
  });
});
