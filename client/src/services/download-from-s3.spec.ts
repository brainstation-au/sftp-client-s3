import * as fs from 'fs';
import * as path from 'path';
import { Readable, Writable } from 'stream';
import { downloadFromS3 } from './download-from-s3';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

const getObjectCreateReadStreamFn = jest.fn();
const getObjectFn = jest.fn(() => ({ createReadStream: getObjectCreateReadStreamFn }));
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
      getObjectCreateReadStreamFn.mockReturnValueOnce(Readable.from([content]));
      await downloadFromS3(bucket, key, localPath);
    });

    afterAll(() => {
      getObjectCreateReadStreamFn.mockReset();
      fs.unlinkSync(localPath);
    });

    test('calls getObject once', () => {
      expect(getObjectCreateReadStreamFn).toHaveBeenCalledTimes(1);
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
    const errorMessage = 'error-message';

    beforeAll(() => {
      fs.mkdirSync(path.dirname(localPath), {recursive: true});
      getObjectCreateReadStreamFn.mockImplementationOnce(() => (new Writable()).emit('error', new Error(errorMessage)));
    });

    afterAll(() => {
      getObjectCreateReadStreamFn.mockReset();
      fs.unlinkSync(localPath);
    });

    test('throws error', async () => {
      await expect(downloadFromS3(bucket, key, localPath)).rejects
        .toThrowError(errorMessage);
    });
  });
});
