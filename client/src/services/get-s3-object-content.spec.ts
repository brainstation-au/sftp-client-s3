import { getS3ObjectContent } from './get-s3-object-content';
import * as s3Uri from '../services/parse-s3-uri';
jest.mock('../services/parse-s3-uri');
const mockedS3Uri = s3Uri as jest.Mocked<typeof s3Uri>;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

const getObjectPromiseFn = jest.fn();
const getObjectFn = jest.fn(() => ({ promise: getObjectPromiseFn }));
AWS.S3 = jest.fn(() => ({
  getObject: getObjectFn,
}));

describe('getS3ObjectContent', () => {
  const content = 'Hello World!\n';

  beforeAll(() => {
    mockedS3Uri.parseS3Uri.mockReturnValueOnce({
      bucket: 'bucket-name',
      key: 's3-key-of-the-file',
    });
    getObjectPromiseFn.mockResolvedValueOnce({Body: Buffer.from(content)});
  });

  afterAll(() => {
    mockedS3Uri.parseS3Uri.mockReset();
    getObjectPromiseFn.mockReset();
    getObjectFn.mockClear();
  });

  test('returns object content', async () => {
    await expect(getS3ObjectContent('s3-uri')).resolves.toEqual(content);
    expect(mockedS3Uri.parseS3Uri).toHaveBeenCalledWith('s3-uri');
    expect(getObjectFn).toHaveBeenCalledWith(expect.objectContaining({
      Bucket: 'bucket-name',
      Key: 's3-key-of-the-file',
    }));
  });
});
