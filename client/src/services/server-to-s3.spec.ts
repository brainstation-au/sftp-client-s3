import * as fs from 'fs';
import moment from 'moment-timezone';
import * as path from 'path';
import { ServerToS3Options } from '../types/server-to-s3-options';
import * as download from './download-from-sftp-server';
import * as storage from './local-storage-location';
import * as openpgp from './openpgp';
import * as remove from './remove-from-sftp-server';
import { serverToS3 } from './server-to-s3';
import * as upload from './upload-to-s3';
jest.mock('fs');
jest.mock('./download-from-sftp-server');
jest.mock('./local-storage-location');
jest.mock('./remove-from-sftp-server');
jest.mock('./upload-to-s3');
jest.mock('./openpgp');
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedDownload = download as jest.Mocked<typeof download>;
const mockedRemove = remove as jest.Mocked<typeof remove>;
const mockedUpload = upload as jest.Mocked<typeof upload>;
const mockedPgp = openpgp as jest.Mocked<typeof openpgp>;
const mockedStorage = storage as jest.Mocked<typeof storage>;

describe('serverToS3', () => {
  const date = moment().tz('utc');
  const year = date.format('YYYY');
  const month = date.format('MM');
  const day = date.format('DD');
  const localDir = '/tmp/qwerty/';
  const uploadDir = '/tmp/ertyui/';

  describe('decrypt is false, clear text content', () => {
    const options: ServerToS3Options = {
      host: 'sftphost',
      port: 22,
      username: 'rsa_user',
      privateKey: 'something',
      location: '/download',
      filename: '*.txt',
      bucket: 'my-bucket',
      keyPrefixFormat: '[my-project/foo/year=]YYYY/[month=]MM/[day=]DD/',
      decrypt: false,
    };

    beforeAll(async () => {
      mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
      mockedDownload.downloadFromSftpServer.mockResolvedValueOnce(['foo.txt', 'bar.txt']);
      await serverToS3(options);
    });

    afterAll(() => {
      mockedDownload.downloadFromSftpServer.mockClear();
      mockedRemove.removeFromSftpServer.mockClear();
      mockedUpload.uploadToS3.mockClear();
      mockedStorage.localStorageLocation.mockClear();
    });

    test('decrypt was not called at all', () => {
      expect(mockedPgp.decrypt).not.toHaveBeenCalled();
    });

    test('upload to s3 was called for both the files', () => {
      expect(mockedUpload.uploadToS3).toHaveBeenCalledTimes(2);
    });

    test('upload to s3 was called with right params', () => {
      expect(mockedUpload.uploadToS3).toHaveBeenCalledWith(
        path.join(localDir, 'foo.txt'),
        'my-bucket',
        `my-project/foo/year=${year}/month=${month}/day=${day}/foo.txt`
      );
      expect(mockedUpload.uploadToS3).toHaveBeenCalledWith(
        path.join(localDir, 'bar.txt'),
        'my-bucket',
        `my-project/foo/year=${year}/month=${month}/day=${day}/bar.txt`
      );
    });

    test('remove from sftp server was called with right params', () => {
      expect(mockedRemove.removeFromSftpServer).toHaveBeenCalledWith(
        options,
        'foo.txt',
      );
      expect(mockedRemove.removeFromSftpServer).toHaveBeenCalledWith(
        options,
        'bar.txt',
      );
    });
  });

  describe('decrypt is true, encrypted content', () => {
    const options: ServerToS3Options = {
      host: 'sftphost',
      port: 22,
      username: 'rsa_user',
      privateKey: 'something',
      location: '/download',
      filename: '*.txt',
      bucket: 'my-bucket',
      keyPrefixFormat: '[my-project/foo/year=]YYYY/[month=]MM/[day=]DD/',
      decrypt: true,
      gpgPrivateKey: 'private-key',
      passphrase: 'my-password',
    };

    beforeAll(async () => {
      mockedFs.readFileSync.mockReturnValueOnce('foo');
      mockedFs.readFileSync.mockReturnValueOnce('bar');
      mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
      mockedStorage.localStorageLocation.mockReturnValueOnce(uploadDir);
      mockedDownload.downloadFromSftpServer.mockResolvedValueOnce(['foo.txt', 'bar.txt']);
      mockedPgp.decrypt.mockResolvedValue('New Hello World!\n');
      await serverToS3(options);
    });

    afterAll(() => {
      mockedDownload.downloadFromSftpServer.mockClear();
      mockedRemove.removeFromSftpServer.mockClear();
      mockedUpload.uploadToS3.mockClear();
      mockedPgp.decrypt.mockClear();
      mockedStorage.localStorageLocation.mockClear();
      mockedFs.readFileSync.mockClear();
      mockedFs.writeFileSync.mockClear();
    });

    test('decrypt was called with write params', () => {
      expect(mockedPgp.decrypt).toHaveBeenCalledWith(
        'foo',
        'private-key',
        'my-password',
      );
      expect(mockedPgp.decrypt).toHaveBeenCalledWith(
        'bar',
        'private-key',
        'my-password',
      );
    });

    test('upload to s3 was called for both the files', () => {
      expect(mockedUpload.uploadToS3).toHaveBeenCalledTimes(2);
    });

    test('upload to s3 was called with right params', () => {
      expect(mockedUpload.uploadToS3).toHaveBeenCalledWith(
        path.join(uploadDir, 'foo.txt'),
        'my-bucket',
        `my-project/foo/year=${year}/month=${month}/day=${day}/foo.txt`
      );
      expect(mockedUpload.uploadToS3).toHaveBeenCalledWith(
        path.join(uploadDir, 'bar.txt'),
        'my-bucket',
        `my-project/foo/year=${year}/month=${month}/day=${day}/bar.txt`
      );
    });

    test('remove from sftp server was called with right params', () => {
      expect(mockedRemove.removeFromSftpServer).toHaveBeenCalledWith(
        options,
        'foo.txt',
      );
      expect(mockedRemove.removeFromSftpServer).toHaveBeenCalledWith(
        options,
        'bar.txt',
      );
    });
  });
});
