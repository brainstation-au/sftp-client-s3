import * as fs from 'fs';
import moment from 'moment-timezone';
import * as path from 'path';
import * as zlib from 'zlib';
import { ServerToS3Options } from '../types/server-to-s3-options';
import * as download from './download-from-sftp-server';
import * as list from './list-from-sftp-server';
import * as storage from './local-storage-location';
import * as remove from './remove-from-sftp-server';
import { serverToS3 } from './server-to-s3';
import * as upload from './upload-to-s3';
import * as gzip from './gzip';
jest.mock('fs');
jest.mock('zlib');
jest.mock('./download-from-sftp-server');
jest.mock('./list-from-sftp-server');
jest.mock('./local-storage-location');
jest.mock('./remove-from-sftp-server');
jest.mock('./upload-to-s3');
jest.mock('./gzip');
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedZlib = zlib as jest.Mocked<typeof zlib>;
const mockedDownload = download as jest.Mocked<typeof download>;
const mockedList = list as jest.Mocked<typeof list>;
const mockedRemove = remove as jest.Mocked<typeof remove>;
const mockedUpload = upload as jest.Mocked<typeof upload>;
const mockedStorage = storage as jest.Mocked<typeof storage>;
const mockedGzip = gzip as jest.Mocked<typeof gzip>;

const resetAll = () => {
  mockedFs.readFileSync.mockReset();
  mockedFs.writeFileSync.mockReset();
  mockedFs.unlinkSync.mockReset();
  mockedZlib.gzipSync.mockReset();
  mockedZlib.gunzipSync.mockReset();
  mockedDownload.downloadFromSftpServer.mockReset();
  mockedList.listFromSftpServer.mockReset();
  mockedRemove.removeFromSftpServer.mockReset();
  mockedUpload.uploadToS3.mockReset();
  mockedStorage.localStorageLocation.mockReset();
  mockedGzip.uncompress.mockReset();
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
    describe(`files are ${item.compression}, rm is false`, () => {
      const options = {
        bucket: 'my-bucket',
        keyPrefixPattern: '[my-project/foo/year=]YYYY/[month=]MM/[day=]DD/',
        location: '/outbox',
        timezone: 'UTC',
        rm: false,
      };
      const keyPrefix = `my-project/foo/year=${year}/month=${month}/day=${day}/`;

      beforeAll(async () => {
        mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
        mockedList.listFromSftpServer.mockResolvedValueOnce(item.files);
        await serverToS3(options as ServerToS3Options);
      });

      afterAll(() => {
        resetAll();
      });

      test('attempted to download files from sftp server', () => {
        expect(mockedDownload.downloadFromSftpServer).toHaveBeenCalledTimes(item.files.length);
        item.files.forEach(file => {
          expect(mockedDownload.downloadFromSftpServer).toHaveBeenCalledWith(
            options,
            path.join(options.location, file),
            path.join(localDir, file),
          );
        });
      });

      test('uploaded files to S3', () => {
        expect(mockedUpload.uploadToS3).toHaveBeenCalledTimes(item.files.length);
        item.files.forEach(file => {
          expect(mockedUpload.uploadToS3).toHaveBeenCalledWith(
            path.join(localDir, file),
            options.bucket,
            keyPrefix + file,
          );
        });
      });

      test('local files were removed', () => {
        expect(fs.unlinkSync).toHaveBeenCalledTimes(item.files.length);
        item.files.forEach(file => {
          expect(fs.unlinkSync).toHaveBeenCalledWith(path.join(localDir, file));
        });
      });

      test('did not call unexpected functions', () => {
        expect(mockedFs.readFileSync).not.toHaveBeenCalled();
        expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
        expect(mockedZlib.gzipSync).not.toHaveBeenCalled();
        expect(mockedZlib.gunzipSync).not.toHaveBeenCalled();
        expect(mockedRemove.removeFromSftpServer).not.toHaveBeenCalled();
        expect(mockedGzip.uncompress).not.toHaveBeenCalled();
      });
    });
  });

  describe('rm is true, files are uncompressed', () => {
    const options = {
      bucket: 'my-bucket',
      keyPrefixPattern: '[my-project/foo/year=]YYYY/[month=]MM/[day=]DD/',
      location: '/outbox',
      timezone: 'UTC',
      rm: true,
    };

    beforeAll(async () => {
      mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
      mockedList.listFromSftpServer.mockResolvedValueOnce(['foo.txt', 'bar.txt']);
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
      expect(mockedGzip.uncompress).not.toHaveBeenCalled();
    });
  });

  describe('gunzip is true, rm is false, files are uncompressed', () => {
    const options = {
      bucket: 'my-bucket',
      keyPrefixPattern: '[my-project/foo/year=]YYYY/[month=]MM/[day=]DD/',
      location: '/outbox',
      timezone: 'UTC',
      rm: false,
      gunzip: true,
    };
    const keyPrefix = `my-project/foo/year=${year}/month=${month}/day=${day}/`;
    const compressedContent = 'compressed-content';
    const uncompressedContent = 'uncompressed-content';

    beforeAll(async () => {
      mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
      mockedList.listFromSftpServer.mockResolvedValueOnce(['foo.txt.gz', 'bar.txt']);
      mockedFs.readFileSync.mockReturnValueOnce(Buffer.from(compressedContent));
      mockedZlib.gunzipSync.mockReturnValueOnce(Buffer.from(uncompressedContent));
      await serverToS3(options as ServerToS3Options);
    });

    afterAll(() => {
      resetAll();
    });

    test('uncompress was called', () => {
      expect(mockedGzip.uncompress).toHaveBeenCalledTimes(1);
      expect(mockedGzip.uncompress).toHaveBeenCalledWith(path.join(localDir, 'foo.txt.gz'), path.join(localDir, 'foo.txt'));
    });

    test('uncompressed file was uploaded', () => {
      expect(mockedUpload.uploadToS3).toHaveBeenCalledTimes(2);
      expect(mockedUpload.uploadToS3).toHaveBeenCalledWith(path.join(localDir, 'foo.txt'), options.bucket, keyPrefix + 'foo.txt');
      expect(mockedUpload.uploadToS3).toHaveBeenCalledWith(path.join(localDir, 'bar.txt'), options.bucket, keyPrefix + 'bar.txt');
    });

    test('local files were removed', () => {
      expect(mockedFs.unlinkSync).toHaveBeenCalledTimes(3);
      expect(mockedFs.unlinkSync).toHaveBeenCalledWith(path.join(localDir, 'foo.txt.gz'));
      expect(mockedFs.unlinkSync).toHaveBeenCalledWith(path.join(localDir, 'foo.txt'));
      expect(mockedFs.unlinkSync).toHaveBeenCalledWith(path.join(localDir, 'bar.txt'));
    });

    test('did not call unexpected functions', () => {
      expect(mockedFs.readFileSync).not.toHaveBeenCalled();
      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
      expect(mockedZlib.gzipSync).not.toHaveBeenCalled();
      expect(mockedZlib.gunzipSync).not.toHaveBeenCalled();
    });
  });
});
