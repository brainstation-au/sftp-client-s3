import * as fs from 'fs';
import moment from 'moment-timezone';
import * as path from 'path';
import * as zlib from 'zlib';
import { ServerToS3Options } from '../types/server-to-s3-options';
import * as download from './download-from-sftp-server';
import * as storage from './local-storage-location';
import * as openpgp from './openpgp';
import * as remove from './remove-from-sftp-server';
import { serverToS3 } from './server-to-s3';
import * as upload from './upload-to-s3';
jest.mock('fs');
jest.mock('zlib');
jest.mock('./download-from-sftp-server');
jest.mock('./local-storage-location');
jest.mock('./remove-from-sftp-server');
jest.mock('./upload-to-s3');
jest.mock('./openpgp');
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedZlib = zlib as jest.Mocked<typeof zlib>;
const mockedDownload = download as jest.Mocked<typeof download>;
const mockedRemove = remove as jest.Mocked<typeof remove>;
const mockedUpload = upload as jest.Mocked<typeof upload>;
const mockedPgp = openpgp as jest.Mocked<typeof openpgp>;
const mockedStorage = storage as jest.Mocked<typeof storage>;

const resetAll = () => {
  mockedFs.readFileSync.mockReset();
  mockedFs.writeFileSync.mockReset();
  mockedZlib.gzipSync.mockReset();
  mockedZlib.gunzipSync.mockReset();
  mockedDownload.downloadFromSftpServer.mockReset();
  mockedRemove.removeFromSftpServer.mockReset();
  mockedUpload.uploadToS3.mockReset();
  mockedPgp.decrypt.mockReset();
  mockedStorage.localStorageLocation.mockReset();
};

describe('serverToS3', () => {
  const date = moment().tz('utc');
  const year = date.format('YYYY');
  const month = date.format('MM');
  const day = date.format('DD');
  const localDir = '/tmp/qwerty/';

  [{
    compression: 'compressed',
    files: ['foo.txt.gz', 'bar.txt.gz'],
  },
  {
    compression: 'uncompressed',
    files: ['foo.txt', 'bar.txt'],
  }].forEach(item => {
    describe(`files are ${item.compression}, decrypt is false, rm is false`, () => {
      const options = {
        bucket: 'my-bucket',
        keyPrefixPattern: '[my-project/foo/year=]YYYY/[month=]MM/[day=]DD/',
        decrypt: false,
        timezone: 'UTC',
        rm: false,
      };
      const keyPrefix = `my-project/foo/year=${year}/month=${month}/day=${day}/`;

      beforeAll(async () => {
        mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
        mockedDownload.downloadFromSftpServer.mockResolvedValueOnce(item.files);
        await serverToS3(options as ServerToS3Options);
      });

      afterAll(() => {
        resetAll();
      });

      test('attempted to download files from sftp server', () => {
        expect(mockedDownload.downloadFromSftpServer).toHaveBeenCalledTimes(1);
        expect(mockedDownload.downloadFromSftpServer).toHaveBeenCalledWith(
          options,
          localDir,
        );
      });

      test('uploaded files to S3', () => {
        expect(mockedUpload.uploadToS3).toHaveBeenCalledTimes(2);
        expect(mockedUpload.uploadToS3).toHaveBeenCalledWith(
          path.join(localDir, item.files[0]),
          options.bucket,
          keyPrefix + item.files[0],
        );
        expect(mockedUpload.uploadToS3).toHaveBeenCalledWith(
          path.join(localDir, item.files[1]),
          options.bucket,
          keyPrefix + item.files[1],
        );
      });

      test('did not call unexpected functions', () => {
        expect(mockedFs.readFileSync).not.toHaveBeenCalled();
        expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
        expect(mockedZlib.gzipSync).not.toHaveBeenCalled();
        expect(mockedZlib.gunzipSync).not.toHaveBeenCalled();
        expect(mockedRemove.removeFromSftpServer).not.toHaveBeenCalled();
        expect(mockedPgp.decrypt).not.toHaveBeenCalled();
      });
    });
  });

  describe('decrypt is true, files are uncompressed, rm is false', () => {
    const options = {
      gpgPrivateKey: 'gpg-private-kye',
      passphrase: 'password',
      bucket: 'my-bucket',
      keyPrefixPattern: '[my-project/foo/year=]YYYY/[month=]MM/[day=]DD/',
      decrypt: true,
      timezone: 'UTC',
      rm: false,
    };
    const fileContent1 = 'encrypted-content-1';
    const fileContent2 = 'encrypted-content-2';
    const decContent1 = 'clear-text-content-1';
    const decContent2 = 'clear-text-content-2';

    beforeAll(async () => {
      mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
      mockedDownload.downloadFromSftpServer.mockResolvedValueOnce(['foo.txt', 'bar.txt']);
      mockedFs.readFileSync.mockReturnValueOnce(Buffer.from(fileContent1));
      mockedFs.readFileSync.mockReturnValueOnce(Buffer.from(fileContent2));
      mockedPgp.decrypt.mockResolvedValueOnce(decContent1);
      mockedPgp.decrypt.mockResolvedValueOnce(decContent2);
      await serverToS3(options as ServerToS3Options);
    });

    afterAll(() => {
      resetAll();
    });

    test('read file contents', () => {
      expect(mockedFs.readFileSync).toHaveBeenCalledTimes(2);
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(path.join(localDir, 'foo.txt'));
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(path.join(localDir, 'bar.txt'));
    });

    test('file contents were decrypted', () => {
      expect(mockedPgp.decrypt).toHaveBeenCalledTimes(2);
      expect(mockedPgp.decrypt).toHaveBeenCalledWith(fileContent1, options.gpgPrivateKey, options.passphrase);
      expect(mockedPgp.decrypt).toHaveBeenCalledWith(fileContent2, options.gpgPrivateKey, options.passphrase);
    });

    test('decrypted content were writted back to files', () => {
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(path.join(localDir, 'foo.txt'), Buffer.from(decContent1));
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(path.join(localDir, 'bar.txt'), Buffer.from(decContent2));
    });

    test('did not call unexpected functions', () => {
      expect(mockedZlib.gzipSync).not.toHaveBeenCalled();
      expect(mockedZlib.gunzipSync).not.toHaveBeenCalled();
      expect(mockedRemove.removeFromSftpServer).not.toHaveBeenCalled();
    });
  });

  describe('decrypt is true, files are compressed, rm is false', () => {
    const options = {
      gpgPrivateKey: 'gpg-private-kye',
      passphrase: 'password',
      bucket: 'my-bucket',
      keyPrefixPattern: '[my-project/foo/year=]YYYY/[month=]MM/[day=]DD/',
      decrypt: true,
      timezone: 'UTC',
      rm: false,
    };
    const fileContent1 = 'encrypted-compressed-content-1';
    const fileContent2 = 'encrypted-compressed-content-2';
    const unzippedContent1 = 'encrypted-content-1';
    const unzippedContent2 = 'encrypted-content-2';
    const decContent1 = 'clear-text-content-1';
    const decContent2 = 'clear-text-content-2';
    const zippedContent1 = 'compressed-content-1';
    const zippedContent2 = 'compressed-content-2';

    beforeAll(async () => {
      mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
      mockedDownload.downloadFromSftpServer.mockResolvedValueOnce(['foo.txt.gz', 'bar.txt.gz']);
      mockedFs.readFileSync.mockReturnValueOnce(Buffer.from(fileContent1));
      mockedFs.readFileSync.mockReturnValueOnce(Buffer.from(fileContent2));
      mockedZlib.gunzipSync.mockReturnValueOnce(Buffer.from(unzippedContent1));
      mockedZlib.gunzipSync.mockReturnValueOnce(Buffer.from(unzippedContent2));
      mockedPgp.decrypt.mockResolvedValueOnce(decContent1);
      mockedPgp.decrypt.mockResolvedValueOnce(decContent2);
      mockedZlib.gzipSync.mockReturnValueOnce(Buffer.from(zippedContent1));
      mockedZlib.gzipSync.mockReturnValueOnce(Buffer.from(zippedContent2));
      await serverToS3(options as ServerToS3Options);
    });

    afterAll(() => {
      resetAll();
    });

    test('file contents were uncompressed', () => {
      expect(mockedZlib.gunzipSync).toHaveBeenCalledTimes(2);
      expect(mockedZlib.gunzipSync).toHaveBeenCalledWith(Buffer.from(fileContent1));
      expect(mockedZlib.gunzipSync).toHaveBeenCalledWith(Buffer.from(fileContent2));
    });

    test('file contents were decrypted', () => {
      expect(mockedPgp.decrypt).toHaveBeenCalledTimes(2);
      expect(mockedPgp.decrypt).toHaveBeenCalledWith(unzippedContent1, options.gpgPrivateKey, options.passphrase);
      expect(mockedPgp.decrypt).toHaveBeenCalledWith(unzippedContent2, options.gpgPrivateKey, options.passphrase);
    });

    test('decrypted content were compressed', () => {
      expect(mockedZlib.gzipSync).toHaveBeenCalledTimes(2);
      expect(mockedZlib.gzipSync).toHaveBeenCalledWith(Buffer.from(decContent1));
      expect(mockedZlib.gzipSync).toHaveBeenCalledWith(Buffer.from(decContent2));
    });

    test('decrypted compressed content were writted back to files', () => {
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(path.join(localDir, 'foo.txt.gz'), Buffer.from(zippedContent1));
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(path.join(localDir, 'bar.txt.gz'), Buffer.from(zippedContent2));
    });

    test('did not call unexpected functions', () => {
      expect(mockedRemove.removeFromSftpServer).not.toHaveBeenCalled();
    });
  });

  describe('rm is true, files are uncompressed, decrypt is false', () => {
    const options = {
      bucket: 'my-bucket',
      keyPrefixPattern: '[my-project/foo/year=]YYYY/[month=]MM/[day=]DD/',
      decrypt: false,
      timezone: 'UTC',
      rm: true,
    };

    beforeAll(async () => {
      mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
      mockedDownload.downloadFromSftpServer.mockResolvedValueOnce(['foo.txt', 'bar.txt']);
      await serverToS3(options as ServerToS3Options);
    });

    afterAll(() => {
      resetAll();
    });

    test('attempted to delete files from sftp server', () => {
      expect(mockedRemove.removeFromSftpServer).toHaveBeenCalledTimes(2);
      expect(mockedRemove.removeFromSftpServer).toHaveBeenCalledWith(options, 'foo.txt');
      expect(mockedRemove.removeFromSftpServer).toHaveBeenCalledWith(options, 'bar.txt');
    });

    test('did not call unexpected functions', () => {
      expect(mockedFs.readFileSync).not.toHaveBeenCalled();
      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
      expect(mockedZlib.gzipSync).not.toHaveBeenCalled();
      expect(mockedZlib.gunzipSync).not.toHaveBeenCalled();
      expect(mockedPgp.decrypt).not.toHaveBeenCalled();
    });
  });

  describe('gunzip is true, rm is false, files are uncompressed, decrypt is false', () => {
    const options = {
      bucket: 'my-bucket',
      keyPrefixPattern: '[my-project/foo/year=]YYYY/[month=]MM/[day=]DD/',
      decrypt: false,
      timezone: 'UTC',
      rm: false,
      gunzip: true,
    };
    const keyPrefix = `my-project/foo/year=${year}/month=${month}/day=${day}/`;
    const compressedContent = 'compressed-content';
    const uncompressedContent = 'uncompressed-content';

    beforeAll(async () => {
      mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
      mockedDownload.downloadFromSftpServer.mockResolvedValueOnce(['foo.txt.gz', 'bar.txt']);
      mockedFs.readFileSync.mockReturnValueOnce(Buffer.from(compressedContent));
      mockedZlib.gunzipSync.mockReturnValueOnce(Buffer.from(uncompressedContent));
      await serverToS3(options as ServerToS3Options);
    });

    afterAll(() => {
      resetAll();
    });

    test('compressed file was read once', () => {
      expect(mockedFs.readFileSync).toHaveBeenCalledTimes(1);
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(path.join(localDir, 'foo.txt.gz'));
    });

    test('file content was uncompressed', () => {
      expect(mockedZlib.gunzipSync).toHaveBeenCalledTimes(1);
      expect(mockedZlib.gunzipSync).toHaveBeenCalledWith(Buffer.from(compressedContent));
    });

    test('uncompressed content was written in a new file', () => {
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(path.join(localDir, 'foo.txt'), Buffer.from(uncompressedContent));
    });

    test('uncompressed file was uploaded', () => {
      expect(mockedUpload.uploadToS3).toHaveBeenCalledTimes(2);
      expect(mockedUpload.uploadToS3).toHaveBeenCalledWith(path.join(localDir, 'foo.txt'), options.bucket, keyPrefix + 'foo.txt');
      expect(mockedUpload.uploadToS3).toHaveBeenCalledWith(path.join(localDir, 'bar.txt'), options.bucket, keyPrefix + 'bar.txt');
    });

    test('did not call unexpected functions', () => {
      expect(mockedZlib.gzipSync).not.toHaveBeenCalled();
      expect(mockedPgp.decrypt).not.toHaveBeenCalled();
    });
  });
});
