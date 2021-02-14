import * as fs from 'fs';
import * as path from 'path';
import Client from 'ssh2-sftp-client';
import { container } from '../inversify/config';
import { SERVER_PARAMS } from '../inversify/constants';
import { execute, SftpService } from './sftp';

const resetDi = () => {
  container.unbind(SERVER_PARAMS);
  container.unbind(SftpService);
};

describe('execute', () => {
  describe('establish sftp connection', () => {
    const testFn = jest.fn(_ => Promise.resolve());
    const callback = async (sftp: Client): Promise<void> => {
      const contentList = await sftp.list('/');
      await testFn(contentList.map(i => i.name));
    };

    ['rsa', 'ecdsa', 'ed25519'].forEach((sshType) => {
      describe(`use ${sshType} key`, () => {
        beforeAll(async () => {
          const options: Client.ConnectOptions = {
            host: 'sftphost',
            port: 22,
            username: `${sshType}_user`,
            privateKey: fs.readFileSync(`/opt/.ssh/id_${sshType}`, 'utf-8'),
          };
          await execute(options, callback);
        });

        afterAll(() => {
          testFn.mockClear();
        });

        test('client can connect to sftp host', () => {
          expect(testFn).toHaveBeenCalledWith(expect.arrayContaining(['.ssh', 'download']));
        });
      });
    });

    describe('use wrong private key', () => {
      const options: Client.ConnectOptions = {
        host: 'sftphost',
        port: 22,
        username: 'rsa_user',
        privateKey: fs.readFileSync('/opt/.ssh/id_ecdsa', 'utf-8'),
      };

      afterAll(() => {
        testFn.mockClear();
      });

      test('client can not connect to sftp host', async () => {
        await expect(execute(options, callback)).rejects.toThrow('sftpConnect: All configured authentication methods failed');
      });
    });

    describe('returns the response from callback', () => {
      const returnValue = {foo: 'bar'};
      const options: Client.ConnectOptions = {
        host: 'sftphost',
        port: 22,
        username: 'rsa_user',
        privateKey: fs.readFileSync('/opt/.ssh/id_rsa', 'utf-8'),
      };

      afterAll(() => {
        testFn.mockClear();
      });

      test('client can not connect to sftp host', async () => {
        await expect(execute(options, () => Promise.resolve(returnValue))).resolves.toEqual(returnValue);
      });
    });
  });
});

describe('sftp service', () => {
  describe('execute with list', () => {
    describe('establish sftp connection', () => {
      ['rsa', 'ecdsa', 'ed25519'].forEach((sshType) => {
        describe(`use ${sshType} key`, () => {
          beforeAll(async () => {
            const options = {
              host: 'sftphost',
              port: 22,
              username: `${sshType}_user`,
              privateKey: fs.readFileSync(`/opt/.ssh/id_${sshType}`, 'utf-8'),
              location: '/',
            };
            container.bind(SERVER_PARAMS).toConstantValue(options);
          });

          afterAll(() => {
            resetDi();
          });

          test('client can connect to sftp host', async () => {
            await expect(container.get(SftpService).list()).resolves.toEqual(expect.arrayContaining(['.ssh', 'download']));
          });
        });
      });

      describe('use wrong private key', () => {
        beforeAll(() => {
          const options = {
            host: 'sftphost',
            port: 22,
            username: 'rsa_user',
            privateKey: fs.readFileSync('/opt/.ssh/id_ecdsa', 'utf-8'),
            location: '/',
          };
          container.bind(SERVER_PARAMS).toConstantValue(options);
        });

        afterAll(() => {
          resetDi();
        });

        test('client can not connect to sftp host', async () => {
          await expect(container.get(SftpService).list()).rejects.toThrow('sftpConnect: All configured authentication methods failed');
        });
      });

      describe('returns the response from callback', () => {
        const returnValue = {foo: 'bar'};
        const options: Client.ConnectOptions = {
          host: 'sftphost',
          port: 22,
          username: 'rsa_user',
          privateKey: fs.readFileSync('/opt/.ssh/id_rsa', 'utf-8'),
        };

        beforeAll(() => {
          container.bind(SERVER_PARAMS).toConstantValue(options);
        });

        afterAll(() => {
          resetDi();
        });

        test('client can not connect to sftp host', async () => {
          await expect(container.get(SftpService).execute(() => Promise.resolve(returnValue))).resolves.toEqual(returnValue);
        });
      });
    });
  });

  describe('list', () => {
    const remoteLocation = '/download';
    const hostDir = path.join(process.env['HOST_VOLUME'] || '', remoteLocation);
    const textFiles: string[] = [
      '20201221183000_foo.txt',
      '20201222183000_bar.txt',
      'baz.txt',
    ];
    const allFilename: string[] = ['unknown'].concat(textFiles);
    const content = 'Hello World!\n';

    beforeAll(() => {
      allFilename.forEach(name => fs.writeFileSync(path.join(hostDir, name), content));
    });

    afterAll(() => {
      fs.readdirSync(hostDir).forEach(p => fs.unlinkSync(path.join(hostDir, p)));
    });

    describe('no filename or patther', () => {
      beforeAll(() => {
        container.bind(SERVER_PARAMS).toConstantValue({
          host: process.env['SFTP_HOST_NAME'] || '',
          port: 22,
          username: 'rsa_user',
          privateKey: fs.readFileSync('/opt/.ssh/id_rsa', 'utf-8'),
          location: remoteLocation,
          filename: undefined,
        });
      });

      afterAll(() => {
        resetDi();
      });

      test('list all files', async () => {
        await expect(container.get(SftpService).list()).resolves.toEqual(expect.arrayContaining(allFilename));
      });
    });

    describe('only .txt files', () => {
      beforeAll(() => {
        container.bind(SERVER_PARAMS).toConstantValue({
          host: process.env['SFTP_HOST_NAME'] || '',
          port: 22,
          username: 'rsa_user',
          privateKey: fs.readFileSync('/opt/.ssh/id_rsa', 'utf-8'),
          location: remoteLocation,
          filename: '*.txt',
        });
      });

      afterAll(() => {
        resetDi();
      });

      test('list all .txt files', async () => {
        await expect(container.get(SftpService).list()).resolves.toEqual(expect.arrayContaining(textFiles));
      });
    });

    describe('with regular expression', () => {
      beforeAll(() => {
        container.bind(SERVER_PARAMS).toConstantValue({
          host: process.env['SFTP_HOST_NAME'] || '',
          port: 22,
          username: 'rsa_user',
          privateKey: fs.readFileSync('/opt/.ssh/id_rsa', 'utf-8'),
          location: remoteLocation,
          filename: '^\\d{14}_.*\.txt$',
        });
      });

      afterAll(() => {
        resetDi();
      });

      test('list only regex maching files', async () => {
        await expect(container.get(SftpService).list()).resolves.toEqual(expect.arrayContaining([
          '20201221183000_foo.txt',
          '20201222183000_bar.txt',
        ]));
      });
    });
  });

  describe('exists', () => {
    const filename = 'foo.txt';
    const remoteLocation = '/download';
    const hostDir = path.join(process.env['HOST_VOLUME'] || '', remoteLocation);
    const filePath = path.join(hostDir, filename);
    const content = 'Hello World!\n';

    beforeAll(() => {
      fs.writeFileSync(filePath, content, {encoding: 'utf-8'});
      container.bind(SERVER_PARAMS).toConstantValue({
        host: process.env['SFTP_HOST_NAME'] || '',
        port: 22,
        username: 'rsa_user',
        privateKey: fs.readFileSync('/opt/.ssh/id_rsa', 'utf-8'),
        location: remoteLocation,
        filename: undefined,
      });
    });

    afterAll(() => {
      fs.unlinkSync(filePath);
      resetDi();
    });

    test('returns true when a file exists in location', async () => {
      await expect(container.get(SftpService).exists(filename)).resolves.toEqual(true);
    });

    test('returns false when a file does not exist in location', async () => {
      await expect(container.get(SftpService).exists('bar.txt')).resolves.toEqual(false);
    });
  });

  describe('download', () => {
    const remoteLocation = '/download';
    const hostDir = path.join(process.env['HOST_VOLUME'] || '', remoteLocation);
    const localDir = '/tmp/foo/';
    const filename = 'foo.txt';
    const content = 'Hello World!\n';
    const hostPath = path.join(hostDir, filename);
    const remotePath = path.join(remoteLocation, filename);
    const localPath = path.join(localDir, filename);

    beforeAll(() => {
      fs.writeFileSync(hostPath, content);
      fs.mkdirSync(localDir, {recursive: true});
      container.bind(SERVER_PARAMS).toConstantValue({
        host: process.env['SFTP_HOST_NAME'] || '',
        port: 22,
        username: 'rsa_user',
        privateKey: fs.readFileSync('/opt/.ssh/id_rsa', 'utf-8'),
        location: remoteLocation,
      });
    });

    afterAll(() => {
      fs.readdirSync(hostDir).forEach(p => fs.unlinkSync(path.join(hostDir, p)));
      fs.readdirSync(localDir).forEach(p => fs.unlinkSync(path.join(localDir, p)));
      resetDi();
    });

    test('downloads a file from SFTP server to local file system', async () => {
      await expect(container.get(SftpService).download(filename, localDir))
        .resolves.toEqual(`${remotePath} was successfully download to ${localPath}!`);
    });
  });

  describe('upload', () => {
    describe('with same name as local file', () => {
      const contentPath = '/upload';
      const hostDir = path.join(process.env['HOST_VOLUME'] || '', contentPath);
      const localPath = '/tmp/upload/foo.txt';
      const content = 'Hello World!\n';

      beforeAll(() => {
        fs.mkdirSync(path.dirname(localPath), {recursive: true});
        fs.writeFileSync(localPath, content);
        container.bind(SERVER_PARAMS).toConstantValue({
          host: process.env['SFTP_HOST_NAME'] || '',
          port: 22,
          username: 'rsa_user',
          privateKey: fs.readFileSync('/opt/.ssh/id_rsa', 'utf-8'),
          location: contentPath,
        });
      });

      afterAll(() => {
        fs.readdirSync(hostDir).forEach(p => fs.unlinkSync(path.join(hostDir, p)));
        fs.unlinkSync(localPath);
        resetDi();
      });

      test('returns success message', async () => {
        await expect(container.get(SftpService).upload(localPath)).resolves
          .toEqual(`${localPath} was successfully uploaded to ${path.join(contentPath, path.basename(localPath))}!`);
      });

      test('file has been uploaded', () => {
        const files = fs.readdirSync(hostDir);
        expect(files.length).toBe(1);
        expect(files.shift()).toBe(path.basename(localPath));
      });
    });

    describe('with filename provided in options', () => {
      const contentPath = '/upload';
      const hostDir = path.join(process.env['HOST_VOLUME'] || '', contentPath);
      const localPath = '/tmp/upload/foo.txt';
      const content = 'Hello World!\n';

      beforeAll(() => {
        fs.mkdirSync(path.dirname(localPath), {recursive: true});
        fs.writeFileSync(localPath, content);
        container.bind(SERVER_PARAMS).toConstantValue({
          host: process.env['SFTP_HOST_NAME'] || '',
          port: 22,
          username: 'rsa_user',
          privateKey: fs.readFileSync('/opt/.ssh/id_rsa', 'utf-8'),
          location: contentPath,
          filename: 'bar.txt',
        });
      });

      afterAll(() => {
        fs.readdirSync(hostDir).forEach(p => fs.unlinkSync(path.join(hostDir, p)));
        fs.unlinkSync(localPath);
        resetDi();
      });

      test('returns success message', async () => {
        await expect(container.get(SftpService).upload(localPath)).resolves
          .toEqual(`${localPath} was successfully uploaded to ${path.join(contentPath, 'bar.txt')}!`);
      });
    });
  });

  describe('remove', () => {
    const remoteLocation = '/download';
    const hostDir = path.join(process.env['HOST_VOLUME'] || '', remoteLocation);
    const filename = 'foo.txt';
    const content = 'Hello World!\n';

    beforeAll(() => {
      fs.writeFileSync(path.join(hostDir, filename), content, {encoding: 'utf-8'});
      container.bind(SERVER_PARAMS).toConstantValue({
        host: process.env['SFTP_HOST_NAME'] || '',
        port: 22,
        username: 'rsa_user',
        privateKey: fs.readFileSync('/opt/.ssh/id_rsa', 'utf-8'),
        location: remoteLocation,
      });
    });

    test('removes file from sftp server', async () => {
      await expect(container.get(SftpService).delete(filename)).resolves.toEqual('Successfully deleted /download/foo.txt');
    });

    test('file is not longer available in the host', () => {
      expect(fs.readdirSync(hostDir).length).toBe(0);
    });
  });
});
