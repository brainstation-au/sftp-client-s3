import * as fs from 'fs';
import { S3ToServerOptions } from '../types/s3-to-server-options';
import * as download from './download-from-s3';
import * as storage from './local-storage-location';
import * as openpgp from './openpgp';
import { s3ToServer } from './s3-to-server';
import * as upload from './upload-to-sftp-server';
jest.mock('fs');
jest.mock('./upload-to-sftp-server');
jest.mock('./download-from-s3');
jest.mock('./local-storage-location');
jest.mock('./openpgp');
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedDownload = download as jest.Mocked<typeof download>;
const mockedUpload = upload as jest.Mocked<typeof upload>;
const mockedStorage = storage as jest.Mocked<typeof storage>;
const mockedPgp = openpgp as jest.Mocked<typeof openpgp>;

describe('s3ToServer', () => {
  describe('encrypt is false, no need to encrypt', () => {
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
      mockedStorage.localStorageLocation.mockReturnValueOnce('/tmp/something/');
      await s3ToServer(options);
    });

    afterAll(() => {
      mockedDownload.downloadFromS3.mockClear();
      mockedUpload.uploadToSftpServer.mockClear();
      mockedStorage.localStorageLocation.mockClear();
    });

    test('download from s3 was called', () => {
      expect(mockedDownload.downloadFromS3).toHaveBeenCalledTimes(1);
      expect(mockedDownload.downloadFromS3).toHaveBeenCalledWith(
        options.bucket,
        options.s3Key,
        '/tmp/something/bar.txt',
      );
    });

    test('upload to sftp server was called with right params', () => {
      expect(mockedUpload.uploadToSftpServer).toHaveBeenCalledWith(
        options,
        '/tmp/something/bar.txt',
      );
    });
  });

  describe('encrypt is true, encrypt the content', () => {
    const options: S3ToServerOptions = {
      host: 'sftphost',
      port: 22,
      username: 'rsa_user',
      privateKey: 'something',
      location: '/upload',
      bucket: 'my-bucket',
      s3Key: 'my-project/foo/bar.txt',
      encrypt: true,
      gpgPublicKey: 'public-key',
    };

    beforeAll(async () => {
      mockedDownload.downloadFromS3.mockResolvedValueOnce();
      mockedUpload.uploadToSftpServer.mockResolvedValue('uploaded');
      mockedStorage.localStorageLocation.mockReturnValueOnce('/tmp/something/');
      mockedStorage.localStorageLocation.mockReturnValueOnce('/tmp/another-thing/');
      mockedFs.readFileSync.mockReturnValueOnce('encrypted-content');
      await s3ToServer(options);
    });

    afterAll(() => {
      mockedDownload.downloadFromS3.mockClear();
      mockedUpload.uploadToSftpServer.mockClear();
      mockedStorage.localStorageLocation.mockClear();
      mockedFs.readFileSync.mockClear();
      mockedFs.writeFileSync.mockClear();
    });

    test('download from s3 was called', () => {
      expect(mockedPgp.encrypt).toHaveBeenCalledTimes(1);
      expect(mockedPgp.encrypt).toHaveBeenCalledWith(
        'encrypted-content',
        'public-key',
      );
    });

    test('encrypt file content', () => {
      expect(mockedDownload.downloadFromS3).toHaveBeenCalledTimes(1);
      expect(mockedDownload.downloadFromS3).toHaveBeenCalledWith(
        options.bucket,
        options.s3Key,
        '/tmp/something/bar.txt',
      );
    });

    test('upload to sftp server was called with right params', () => {
      expect(mockedUpload.uploadToSftpServer).toHaveBeenCalledWith(
        options,
        '/tmp/another-thing/bar.txt',
      );
    });
  });
});
