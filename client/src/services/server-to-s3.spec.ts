import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { container } from '../inversify/config';
import * as gzip from './gzip';
import * as storage from './local-storage-location';
import { serverToS3 } from './server-to-s3';
import { SftpService } from './sftp';
import * as sftpMock from './sftp.mock';
import * as upload from './upload-to-s3';
jest.mock('fs');
jest.mock('zlib');
jest.mock('./local-storage-location');
jest.mock('./upload-to-s3');
jest.mock('./gzip');
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedZlib = zlib as jest.Mocked<typeof zlib>;
const mockedUpload = upload as jest.Mocked<typeof upload>;
const mockedStorage = storage as jest.Mocked<typeof storage>;
const mockedGzip = gzip as jest.Mocked<typeof gzip>;

const resetAll = () => {
  mockedFs.readFileSync.mockReset();
  mockedFs.writeFileSync.mockReset();
  mockedFs.unlinkSync.mockReset();
  mockedZlib.gzipSync.mockReset();
  mockedZlib.gunzipSync.mockReset();
  mockedUpload.uploadToS3.mockReset();
  mockedStorage.localStorageLocation.mockReset();
  mockedGzip.uncompress.mockReset();
  sftpMock.resetSftpServiceMock();
};

describe('serverToS3', () => {
  const localDir = '/tmp/qwerty/';

  beforeAll(() => {
    container.bind(SftpService).toConstantValue(new sftpMock.SftpServiceMock());
  });

  afterAll(() => {
    container.unbind(SftpService);
  });

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
        keyPrefix: 'my-project/foo/year=2021/month=02/day=01/',
        rm: false,
        gunzip: false,
      };

      beforeAll(async () => {
        mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
        sftpMock.listFn.mockResolvedValueOnce(item.files);
        await serverToS3(options);
      });

      afterAll(() => {
        resetAll();
      });

      test('attempted to download files from sftp server', () => {
        expect(sftpMock.downloadFn).toHaveBeenCalledTimes(item.files.length);
        item.files.forEach(file => {
          expect(sftpMock.downloadFn).toHaveBeenCalledWith(file, localDir);
        });
      });

      test('uploaded files to S3', () => {
        expect(mockedUpload.uploadToS3).toHaveBeenCalledTimes(item.files.length);
        item.files.forEach(file => {
          expect(mockedUpload.uploadToS3).toHaveBeenCalledWith(
            path.join(localDir, file),
            options.bucket,
            options.keyPrefix + file,
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
        expect(sftpMock.deleteFn).not.toHaveBeenCalled();
        expect(mockedGzip.uncompress).not.toHaveBeenCalled();
      });
    });
  });

  describe('rm is true, files are uncompressed', () => {
    const options = {
      bucket: 'my-bucket',
      keyPrefix: 'my-project/foo/year=2021/month=02/day=01/',
      gunzip: false,
      rm: true,
    };

    beforeAll(async () => {
      mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
      sftpMock.listFn.mockResolvedValueOnce(['foo.txt', 'bar.txt']);
      await serverToS3(options);
    });

    afterAll(() => {
      resetAll();
    });

    test('attempted to delete files from sftp server', () => {
      expect(sftpMock.deleteFn).toHaveBeenCalledTimes(2);
      expect(sftpMock.deleteFn).toHaveBeenCalledWith('foo.txt');
      expect(sftpMock.deleteFn).toHaveBeenCalledWith('bar.txt');
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
      keyPrefix: 'my-project/foo/year=2021/month=02/day=01/',
      rm: false,
      gunzip: true,
    };
    const compressedContent = 'compressed-content';
    const uncompressedContent = 'uncompressed-content';

    beforeAll(async () => {
      mockedStorage.localStorageLocation.mockReturnValueOnce(localDir);
      sftpMock.listFn.mockResolvedValueOnce(['foo.txt.gz', 'bar.txt']);
      mockedFs.readFileSync.mockReturnValueOnce(Buffer.from(compressedContent));
      mockedZlib.gunzipSync.mockReturnValueOnce(Buffer.from(uncompressedContent));
      await serverToS3(options);
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
      expect(mockedUpload.uploadToS3).toHaveBeenCalledWith(
        path.join(localDir, 'foo.txt'),
        options.bucket,
        options.keyPrefix + 'foo.txt',
      );
      expect(mockedUpload.uploadToS3).toHaveBeenCalledWith(
        path.join(localDir, 'bar.txt'),
        options.bucket,
        options.keyPrefix + 'bar.txt',
      );
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
