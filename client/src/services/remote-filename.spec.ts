import { remoteFilename } from './remote-filename';

describe('remoteFilename', () => {
  test('no filename provided in options', () => {
    expect(remoteFilename('/tmp/foo/bar.txt')).toEqual('bar.txt');
  });

  test('gzipped file to upload, filename does not have .gz', () => {
    expect(remoteFilename('/tmp/foo/bar.txt.gz', 'foo.txt')).toEqual('foo.txt.gz');
  });

  test('uncompressed file to upload, filename has .gz', () => {
    expect(remoteFilename('/tmp/foo/bar.txt', 'foo.txt.gz')).toEqual('foo.txt');
  });

  test('uncompressed file to upload, filename does not have .gz', () => {
    expect(remoteFilename('/tmp/foo/bar.txt', 'foo.txt')).toEqual('foo.txt');
  });

  test('uncompressed file to upload, filename does not have .gz', () => {
    expect(remoteFilename('/tmp/foo/bar.txt', '/tmp/foo.txt')).toEqual('foo.txt');
  });
});
