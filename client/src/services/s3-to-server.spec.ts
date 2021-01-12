import { S3ToServerOptions } from '../types/s3-to-server-options';
import * as download from './download-from-s3';
import { s3ToServer } from './s3-to-server';
import * as upload from './upload-to-sftp-server';
jest.mock('./upload-to-sftp-server');
jest.mock('./download-from-s3');
const mockedDownload = download as jest.Mocked<typeof download>;
const mockedUpload = upload as jest.Mocked<typeof upload>;

describe('s3ToServer', () => {
  const options: S3ToServerOptions = {
    host: 'sftphost',
    port: 22,
    username: 'rsa_user',
    privateKey: 'something',
    location: '/upload',
    bucket: 'my-bucket',
    s3Key: 'my-project/foo/bar.txt',
    encrypt: false,
  };

  beforeAll(async () => {
    mockedDownload.downloadFromS3.mockResolvedValueOnce();
    mockedUpload.uploadToSftpServer.mockResolvedValue('uploaded');
    await s3ToServer(options);
  });

  afterAll(() => {
    mockedDownload.downloadFromS3.mockClear();
    mockedUpload.uploadToSftpServer.mockClear();
  });

  test('download from s3 was called', () => {
    expect(mockedDownload.downloadFromS3).toHaveBeenCalledTimes(1);
    expect(mockedDownload.downloadFromS3).toHaveBeenCalledWith(
      options.bucket,
      options.s3Key,
      expect.stringMatching(/\/tmp\/.+\/bar\.txt/)
    );
  });

  test('upload to sftp server was called with right params', () => {
    expect(mockedUpload.uploadToSftpServer).toHaveBeenCalledWith(
      options,
      expect.stringMatching(/\/tmp\/.+\/bar\.txt/)
    );
  });
});
