import * as fs from 'fs';
import Client from 'ssh2-sftp-client';
import { execute } from './sftp';

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
            privateKey: fs.readFileSync(`/root/.ssh/id_${sshType}`, 'utf-8'),
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
        privateKey: fs.readFileSync('/root/.ssh/id_ecdsa', 'utf-8'),
      };

      afterAll(() => {
        testFn.mockClear();
      });

      test('client can not connect to sftp host', async () => {
        await expect(execute(options, callback)).rejects.toThrow('connect: sftpConnect: All configured authentication methods failed');
      });
    });

    describe('returns the response from callback', () => {
      const returnValue = {foo: 'bar'};
      const options: Client.ConnectOptions = {
        host: 'sftphost',
        port: 22,
        username: 'rsa_user',
        privateKey: fs.readFileSync('/root/.ssh/id_rsa', 'utf-8'),
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
