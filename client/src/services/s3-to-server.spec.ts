import * as fs from 'fs';
import * as zlib from 'zlib';
import { container } from '../inversify/config';
import * as download from './download-from-s3';
import * as gzip from './gzip';
import * as storage from './local-storage-location';
import { s3ToServer } from './s3-to-server';
import { SftpService } from './sftp';
import * as sftpMock from './sftp.mock';
jest.mock('fs');
jest.mock('zlib');
jest.mock('./download-from-s3');
jest.mock('./local-storage-location');
jest.mock('./gzip');
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedZlib = zlib as jest.Mocked<typeof zlib>;
const mockedDownload = download as jest.Mocked<typeof download>;
const mockedStorage = storage as jest.Mocked<typeof storage>;
const mockedGzip = gzip as jest.Mocked<typeof gzip>;

const resetAll = () => {
  mockedFs.readFileSync.mockReset();
  mockedFs.writeFileSync.mockReset();
  mockedFs.unlinkSync.mockReset();
  mockedZlib.gzipSync.mockReset();
  mockedZlib.gunzipSync.mockReset();
  mockedDownload.downloadFromS3.mockReset();
  mockedStorage.localStorageLocation.mockReset();
  mockedGzip.compress.mockReset();
};

describe('s3ToServer', () => {
  beforeAll(() => {
    container.bind(SftpService).toConstantValue(new sftpMock.SftpServiceMock());
  });

  afterAll(() => {
    container.unbind(SftpService);
  });

  [{
    compression: 'compressed',
    filename: 'bar.txt.gz',
  }, {
    compression: 'uncompressed',
    filename: 'bar.txt',
  }].forEach(item => {
    describe(`file is ${item.compression}, gzip is not set`, () => {
      const options = {
        bucket: 'my-bucket',
        s3Key: 'my-project/foo/' + item.filename,
        gzip: false,
        rm: false,
      };
      const localDir = '/tmp/something/';
      const localPath = localDir + item.filename;

      beforeAll(async () => {
        mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
        await s3ToServer(options);
      });

      afterAll(() => {
        resetAll();
        sftpMock.resetSftpServiceMock();
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
        expect(sftpMock.uploadFn).toHaveBeenCalledTimes(1);
        expect(sftpMock.uploadFn).toHaveBeenCalledWith(
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
      rm: false,
    };
    const localDir = '/tmp/something/';
    const localPath = localDir + 'bar.txt';

    beforeAll(async () => {
      mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
      await s3ToServer(options);
    });

    afterAll(() => {
      resetAll();
      sftpMock.resetSftpServiceMock();
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
    };
    const localDir = '/tmp/something/';

    describe('when a file does not exit', () => {
      beforeAll(async () => {
        sftpMock.existsFn.mockResolvedValueOnce(false);
        mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
        await s3ToServer(options);
      });

      afterAll(() => {
        resetAll();
        sftpMock.resetSftpServiceMock();
      });

      test('file existance was checked', () => {
        expect(sftpMock.existsFn).toHaveBeenCalledTimes(1);
        expect(sftpMock.existsFn).toHaveBeenCalledWith('bar.txt');
      });

      test('no attempt to remove a file', () => {
        expect(sftpMock.deleteFn).not.toHaveBeenCalled();
      });
    });

    describe('when a file exits', () => {
      beforeAll(async () => {
        mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
        sftpMock.existsFn.mockResolvedValueOnce(true);
        await s3ToServer(options);
      });

      afterAll(() => {
        resetAll();
        sftpMock.resetSftpServiceMock();
      });

      test('no attempt to remove a file', () => {
        expect(sftpMock.deleteFn).toHaveBeenCalledTimes(1);
        expect(sftpMock.deleteFn).toHaveBeenCalledWith('bar.txt');
      });
    });
  });
});
