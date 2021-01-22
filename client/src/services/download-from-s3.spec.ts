import * as fs from 'fs';
import * as path from 'path';
import { downloadFromS3 } from './download-from-s3';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

const getObjectPromiseFn = jest.fn();
const getObjectFn = jest.fn(() => ({ promise: getObjectPromiseFn }));
AWS.S3 = jest.fn(() => ({
  getObject: getObjectFn,
}));

describe('downloadFromS3', () => {
  describe('success', () => {
    const localPath = '/tmp/foo/bar.txt';
    const bucket = 'my-bucket';
    const key = 'my-project/foo/bar.txt';
    const content = 'Hello World!\n';

    beforeAll(async () => {
      fs.mkdirSync(path.dirname(localPath), {recursive: true});
      getObjectPromiseFn.mockResolvedValueOnce({Body: Buffer.from(content)});
      await downloadFromS3(bucket, key, localPath);
    });

    afterAll(() => {
      getObjectPromiseFn.mockReset();
      fs.unlinkSync(localPath);
    });

    test('calls getObject once', () => {
      expect(getObjectPromiseFn).toHaveBeenCalledTimes(1);
    });

    test('calls getobject with right params', () => {
      expect(getObjectFn).toHaveBeenCalledWith(expect.objectContaining({
        Bucket: bucket,
        Key: key,
      }));
    });

    test('downloaded file has right content', () => {
      expect(fs.readFileSync(localPath, 'utf-8')).toEqual(content);
    });
  });

  describe('error', () => {
    const localPath = '/tmp/foo/bar.txt';
    const bucket = 'my-bucket';
    const key = 'my-project/foo/bar.txt';

    beforeAll(() => {
      fs.mkdirSync(path.dirname(localPath), {recursive: true});
      getObjectPromiseFn.mockResolvedValueOnce({});
    });

    afterAll(() => {
      getObjectPromiseFn.mockReset();
      fs.unlinkSync(localPath);
    });

    test('throws error', async () => {
      await expect(downloadFromS3(bucket, key, localPath)).rejects
        .toThrowError('Unable to retrieve object from bucket: my-bucket and key: my-project/foo/bar.txt');
    });
  });
});
