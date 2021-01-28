import * as fs from 'fs';
import * as zlib from 'zlib';
import { S3ToServerOptions } from '../types/s3-to-server-options';
import * as download from './download-from-s3';
import * as storage from './local-storage-location';
import * as openpgp from './openpgp';
import * as gzip from './gzip';
import { s3ToServer } from './s3-to-server';
import * as upload from './upload-to-sftp-server';
jest.mock('fs');
jest.mock('zlib');
jest.mock('./upload-to-sftp-server');
jest.mock('./download-from-s3');
jest.mock('./local-storage-location');
jest.mock('./openpgp');
jest.mock('./gzip');
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedZlib = zlib as jest.Mocked<typeof zlib>;
const mockedDownload = download as jest.Mocked<typeof download>;
const mockedUpload = upload as jest.Mocked<typeof upload>;
const mockedStorage = storage as jest.Mocked<typeof storage>;
const mockedPgp = openpgp as jest.Mocked<typeof openpgp>;
const mockedGzip = gzip as jest.Mocked<typeof gzip>;

const resetAll = () => {
  mockedFs.readFileSync.mockReset();
  mockedFs.writeFileSync.mockReset();
  mockedZlib.gzipSync.mockReset();
  mockedZlib.gunzipSync.mockReset();
  mockedDownload.downloadFromS3.mockReset();
  mockedUpload.uploadToSftpServer.mockReset();
  mockedStorage.localStorageLocation.mockReset();
  mockedPgp.encrypt.mockReset();
  mockedGzip.compress.mockReset();
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
        encrypt: false,
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

      test('no other function were called', () => {
        expect(mockedFs.readFileSync).not.toHaveBeenCalled();
        expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
        expect(mockedZlib.gzipSync).not.toHaveBeenCalled();
        expect(mockedZlib.gunzipSync).not.toHaveBeenCalled();
        expect(mockedPgp.encrypt).not.toHaveBeenCalled();
        expect(mockedGzip.compress).not.toHaveBeenCalled();
      });
    });
  });

  describe('enctrypt is true, file is uncompressed, gzip is not set', () => {
    const options = {
      bucket: 'my-bucket',
      s3Key: 'my-project/foo/bar.txt',
      encrypt: true,
      gpgPublicKey: 'public-key',
    };
    const localDir = '/tmp/something/';
    const localPath = localDir + 'bar.txt';
    const fileContent = 'clear-text-content';
    const encContent = 'encrypted-content';

    beforeAll(async () => {
      mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
      mockedFs.readFileSync.mockReturnValueOnce(Buffer.from(fileContent));
      mockedPgp.encrypt.mockResolvedValueOnce(encContent);
      await s3ToServer(options as S3ToServerOptions);
    });

    afterAll(() => {
      resetAll();
    });

    test('read local file once', () => {
      expect(mockedFs.readFileSync).toHaveBeenCalledTimes(1);
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(localPath);
    });

    test('encrypt file content', () => {
      expect(mockedPgp.encrypt).toHaveBeenCalledTimes(1);
      expect(mockedPgp.encrypt).toHaveBeenCalledWith(
        fileContent,
        'public-key',
      );
    });

    test('write encrypted content', () => {
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        localPath,
        Buffer.from(encContent),
      );
    });

    test('no other function were called', () => {
      expect(mockedZlib.gzipSync).not.toHaveBeenCalled();
      expect(mockedZlib.gunzipSync).not.toHaveBeenCalled();
      expect(mockedGzip.compress).not.toHaveBeenCalled();
    });
  });

  describe('enctrypt is true, file is compressed, gzip is not set', () => {
    const options = {
      bucket: 'my-bucket',
      s3Key: 'my-project/foo/bar.txt.gz',
      encrypt: true,
      gpgPublicKey: 'public-key',
    };
    const localDir = '/tmp/something/';
    const localPath = localDir + 'bar.txt.gz';
    const fileContent = 'compressed-content';
    const clearContent = 'clear-text-content';
    const encContent = 'encrypted-content';
    const encCompressedContent = 'encrypted-compressed-content';

    beforeAll(async () => {
      mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
      mockedFs.readFileSync.mockReturnValueOnce(Buffer.from(fileContent));
      mockedPgp.encrypt.mockResolvedValueOnce(encContent);
      mockedZlib.gunzipSync.mockReturnValueOnce(Buffer.from(clearContent));
      mockedZlib.gzipSync.mockReturnValueOnce(Buffer.from(encCompressedContent));
      await s3ToServer(options as S3ToServerOptions);
    });

    afterAll(() => {
      resetAll();
    });

    test('read local file once', () => {
      expect(mockedFs.readFileSync).toHaveBeenCalledTimes(1);
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(localPath);
    });

    test('uncompress file content', () => {
      expect(mockedZlib.gunzipSync).toHaveBeenCalledTimes(1);
      expect(mockedZlib.gunzipSync).toHaveBeenCalledWith(Buffer.from(fileContent));
    });

    test('encrypt file content', () => {
      expect(mockedPgp.encrypt).toHaveBeenCalledTimes(1);
      expect(mockedPgp.encrypt).toHaveBeenCalledWith(
        clearContent,
        'public-key',
      );
    });

    test('compress encrypted content', () => {
      expect(mockedZlib.gzipSync).toHaveBeenCalledTimes(1);
      expect(mockedZlib.gzipSync).toHaveBeenCalledWith(Buffer.from(encContent));
    });

    test('write encrypted compressed content', () => {
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        localPath,
        Buffer.from(encCompressedContent),
      );
    });

    test('no other function were called', () => {
      expect(mockedGzip.compress).not.toHaveBeenCalled();
    });
  });

  describe('gzip is true, file is uncompressed, enctrypt is false', () => {
    const options = {
      bucket: 'my-bucket',
      s3Key: 'my-project/foo/' + 'bar.txt',
      encrypt: false,
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

    test('no other function were called', () => {
      expect(mockedFs.readFileSync).not.toHaveBeenCalled();
      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
      expect(mockedZlib.gzipSync).not.toHaveBeenCalled();
      expect(mockedZlib.gunzipSync).not.toHaveBeenCalled();
      expect(mockedPgp.encrypt).not.toHaveBeenCalled();
    });
  });
});
