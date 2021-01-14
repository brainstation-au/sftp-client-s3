import * as fs from 'fs';
import * as path from 'path';
import {localStorageLocation} from './local-storage-location';

describe('localStorageLocation', () => {
  describe('with no environment variable set', () => {
    let localDir: string;

    beforeAll(() => {
      localDir = localStorageLocation();
    });

    afterAll(() => {
      fs.rmSync(localDir, {recursive: true});
    });

    test('path pattern', () => {
      expect(localDir).toEqual(expect.stringMatching(/^\/tmp\/.{6}$/));
    });

    test('a file can be created', () => {
      expect(() => fs.writeFileSync(path.join(localDir, 'foo.txt'), 'Hello')).not.toThrow();
    });
  });

  describe('with the environment variable set', () => {
    let localDir: string;

    beforeAll(() => {
      process.env['STORAGE_LOCATION'] = '/foo/bar/baz/';
      localDir = localStorageLocation();
    });

    afterAll(() => {
      delete process.env['STORAGE_LOCATION'];
      fs.rmSync(localDir, {recursive: true});
    });

    test('path pattern', () => {
      expect(localDir).toEqual(expect.stringMatching(/^\/foo\/bar\/baz\/.{6}$/));
    });

    test('a file can be created', () => {
      expect(() => fs.writeFileSync(path.join(localDir, 'foo.txt'), 'Hello')).not.toThrow();
    });
  });
});
