import * as fs from 'fs';
import * as zlib from 'zlib';
import { S3ToServerOptions } from '../types/s3-to-server-options';
import * as download from './download-from-s3';
import * as storage from './local-storage-location';
import * as gzip from './gzip';
import { s3ToServer } from './s3-to-server';
import * as upload from './upload-to-sftp-server';
import * as exists from './exists-in-sftp-server';
import * as remove from './remove-from-sftp-server';
jest.mock('fs');
jest.mock('zlib');
jest.mock('./upload-to-sftp-server');
jest.mock('./download-from-s3');
jest.mock('./local-storage-location');
jest.mock('./gzip');
jest.mock('./exists-in-sftp-server');
jest.mock('./remove-from-sftp-server');
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedZlib = zlib as jest.Mocked<typeof zlib>;
const mockedDownload = download as jest.Mocked<typeof download>;
const mockedUpload = upload as jest.Mocked<typeof upload>;
const mockedStorage = storage as jest.Mocked<typeof storage>;
const mockedGzip = gzip as jest.Mocked<typeof gzip>;
const mockedExists = exists as jest.Mocked<typeof exists>;
const mockedRemove = remove as jest.Mocked<typeof remove>;

const resetAll = () => {
  mockedFs.readFileSync.mockReset();
  mockedFs.writeFileSync.mockReset();
  mockedFs.unlinkSync.mockReset();
  mockedZlib.gzipSync.mockReset();
  mockedZlib.gunzipSync.mockReset();
  mockedDownload.downloadFromS3.mockReset();
  mockedUpload.uploadToSftpServer.mockReset();
  mockedStorage.localStorageLocation.mockReset();
  mockedGzip.compress.mockReset();
  mockedExists.existsInSftpServer.mockReset();
  mockedRemove.removeFromSftpServer.mockReset();
};

describe('s3ToServer', () => {
  [{
    compression: 'compressed',
    filename: 'bar.txt.gz',
  }, {
    compression: 'uncompressed',
    filename: 'bar.txt',
  }].forEach(item => {
    describe(`file is ${item.compression}, enctrypt is false, gzip is not set`, () => {
      const options = {
        bucket: 'my-bucket',
        s3Key: 'my-project/foo/' + item.filename,
      };
      const localDir = '/tmp/something/';
      const localPath = localDir + item.filename;

      beforeAll(async () => {
        mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
        await s3ToServer(options as S3ToServerOptions);
      });

      afterAll(() => {
        resetAll();
      });

      test('generate local storage path once', () => {
        expect(mockedStorage.localStorageLocation).toHaveBeenCalledTimes(1);
      });

      test('download object from S3', () => {
        expect(mockedDownload.downloadFromS3).toHaveBeenCalledTimes(1);
        expect(mockedDownload.downloadFromS3).toHaveBeenCalledWith(
          options.bucket,
          options.s3Key,
          localPath,
        );
      });

      test('upload file to sftp server', () => {
        expect(mockedUpload.uploadToSftpServer).toHaveBeenCalledTimes(1);
        expect(mockedUpload.uploadToSftpServer).toHaveBeenCalledWith(
          options,
          localPath,
        );
      });

      test('local files were removed', () => {
        expect(fs.unlinkSync).toHaveBeenCalledTimes(1);
        expect(fs.unlinkSync).toHaveBeenLastCalledWith(localPath);
      });

      test('no other function were called', () => {
        expect(mockedFs.readFileSync).not.toHaveBeenCalled();
        expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
        expect(mockedZlib.gzipSync).not.toHaveBeenCalled();
        expect(mockedZlib.gunzipSync).not.toHaveBeenCalled();
        expect(mockedGzip.compress).not.toHaveBeenCalled();
      });
    });
  });

  describe('gzip is true, file is uncompressed, enctrypt is false', () => {
    const options = {
      bucket: 'my-bucket',
      s3Key: 'my-project/foo/' + 'bar.txt',
      gzip: true,
    };
    const localDir = '/tmp/something/';
    const localPath = localDir + 'bar.txt';

    beforeAll(async () => {
      mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
      await s3ToServer(options as S3ToServerOptions);
    });

    afterAll(() => {
      resetAll();
    });

    test('compress was called with filepaths', () => {
      expect(mockedGzip.compress).toHaveBeenCalledTimes(1);
      expect(mockedGzip.compress).toHaveBeenCalledWith(localPath, localPath + '.gz');
    });

    test('local files were removed', () => {
      expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
      expect(fs.unlinkSync).toHaveBeenCalledWith(localPath);
      expect(fs.unlinkSync).toHaveBeenCalledWith(localPath + '.gz');
    });

    test('no other function were called', () => {
      expect(mockedFs.readFileSync).not.toHaveBeenCalled();
      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
      expect(mockedZlib.gzipSync).not.toHaveBeenCalled();
      expect(mockedZlib.gunzipSync).not.toHaveBeenCalled();
    });
  });

  describe('rm is true, all other branches are false', () => {
    const options = {
      bucket: 'my-bucket',
      s3Key: 'my-project/foo/' + 'bar.txt',
      gzip: false,
      rm: true,
      location: '/foo'
    };
    const localDir = '/tmp/something/';

    describe('when a file does not exit', () => {
      beforeAll(async () => {
        mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
        mockedExists.existsInSftpServer.mockResolvedValueOnce(false);
        await s3ToServer(options as S3ToServerOptions);
      });

      afterAll(() => {
        resetAll();
      });

      test('file existance was checked', () => {
        expect(mockedExists.existsInSftpServer).toHaveBeenCalledTimes(1);
        expect(mockedExists.existsInSftpServer).toHaveBeenCalledWith(options, 'bar.txt');
      });

      test('no attempt to remove a file', () => {
        expect(mockedRemove.removeFromSftpServer).not.toHaveBeenCalled();
      });
    });

    describe('when a file exits', () => {
      beforeAll(async () => {
        mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
        mockedExists.existsInSftpServer.mockResolvedValueOnce(true);
        await s3ToServer(options as S3ToServerOptions);
      });

      afterAll(() => {
        resetAll();
      });

      test('no attempt to remove a file', () => {
        expect(mockedRemove.removeFromSftpServer).toHaveBeenCalledTimes(1);
        expect(mockedRemove.removeFromSftpServer).toHaveBeenCalledWith(options, 'bar.txt');
      });
    });
  });
});
