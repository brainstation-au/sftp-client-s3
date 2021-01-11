import moment from 'moment-timezone';
import { ServerToS3Options } from '../types/server-to-s3-options';
import * as download from './download-from-sftp-server';
import { serverToS3 } from './server-to-s3';
import * as upload from './upload-to-s3';
jest.mock('./download-from-sftp-server');
jest.mock('./upload-to-s3');
const mockedDownload = download as jest.Mocked<typeof download>;
const mockedUpload = upload as jest.Mocked<typeof upload>;

describe('serverToS3', () => {
  const options: ServerToS3Options = {
    host: 'sftphost',
    port: 22,
    username: 'rsa_user',
    privateKey: 'something',
    location: '/download',
    filename: '*.txt',
    bucket: 'my-bucket',
    keyPrefix: '[my-project/foo/year=]YYYY/[month=]MM/[day=]DD/',
    decrypt: false,
  };
  const date = moment().tz('utc');
  const year = date.format('YYYY');
  const month = date.format('MM');
  const day = date.format('DD');

  beforeAll(async () => {
    mockedDownload.downloadFromSftpServer.mockResolvedValueOnce(['/tmp/qwerty/foo.txt', '/tmp/qwerty/bar.txt']);
    mockedUpload.uploadToS3.mockResolvedValue({});
    await serverToS3(options);
  });

  afterAll(() => {
    mockedDownload.downloadFromSftpServer.mockClear();
    mockedUpload.uploadToS3.mockClear();
  });

  test('upload to s3 was called for both the files', () => {
    expect(mockedUpload.uploadToS3).toHaveBeenCalledTimes(2);
  });

  test('upload to s3 was called with right params', () => {
    expect(mockedUpload.uploadToS3).toHaveBeenCalledWith(
      '/tmp/qwerty/foo.txt',
      'my-bucket',
      `my-project/foo/year=${year}/month=${month}/day=${day}/foo.txt`
    );
    expect(mockedUpload.uploadToS3).toHaveBeenCalledWith(
      '/tmp/qwerty/bar.txt',
      'my-bucket',
      `my-project/foo/year=${year}/month=${month}/day=${day}/bar.txt`
    );
  });
});
