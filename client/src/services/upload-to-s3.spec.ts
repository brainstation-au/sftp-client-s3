import * as fs from 'fs';
import * as path from 'path';
import { uploadToS3 } from './upload-to-s3';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

const putObjectPromiseFn = jest.fn();
const putObjectFn = jest.fn(() => ({ promise: putObjectPromiseFn }));
AWS.S3 = jest.fn(() => ({
  putObject: putObjectFn,
}));

describe('uploadToS3', () => {
  const localPath = '/tmp/foo/bar.txt';
  const bucket = 'my-bucket';
  const key = 'my-project/foo/bar.txt';
  const content = 'Hello World!\n';

  beforeAll(async () => {
    fs.mkdirSync(path.dirname(localPath), {recursive: true});
    fs.writeFileSync(localPath, content);
    await uploadToS3(localPath, bucket, key);
  });

  afterAll(() => {
    fs.unlinkSync(localPath);
  });

  test('calls putobject once', () => {
    expect(putObjectPromiseFn).toHaveBeenCalledTimes(1);
  });

  test('calls putobject with right params', () => {
    expect(putObjectFn).toHaveBeenCalledWith(expect.objectContaining({
      Body: Buffer.from(content),
      Bucket: bucket,
      Key: key,
    }));
  });
});
