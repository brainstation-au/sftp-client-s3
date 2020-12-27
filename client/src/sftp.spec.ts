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

    beforeAll(async () => {
      process.env['SFTP_HOST'] = 'sftphost';
    });

    afterAll(async () => {
      delete process.env['SFTP_HOST'];
    });

    ['rsa', 'ecdsa', 'ed25519'].forEach((sshType) => {
      describe(`use ${sshType} key`, () => {
        beforeAll(async () => {
          process.env['SFTP_USER'] = `${sshType}_user`;
          process.env['PRIVATE_KEY'] = fs.readFileSync(`/root/.ssh/id_${sshType}`, 'utf-8');
          await execute(callback);
        });

        afterAll(() => {
          delete process.env['SFTP_USER'];
          delete process.env['PRIVATE_KEY'];
          testFn.mockClear();
        });

        test('client can connect to sftp host', () => {
          expect(testFn).toHaveBeenCalledWith(expect.arrayContaining(['.ssh', 'download']));
        });
      });
    });

    describe('use wrong private key', () => {
      beforeAll(() => {
        process.env['SFTP_USER'] = 'rsa_user';
        process.env['PRIVATE_KEY'] = fs.readFileSync('/root/.ssh/id_ecdsa', 'utf-8');
      });

      afterAll(() => {
        delete process.env['SFTP_USER'];
        delete process.env['PRIVATE_KEY'];
        testFn.mockClear();
      });

      test('client can not connect to sftp host', async () => {
        await expect(execute(callback)).rejects.toThrow('connect: sftpConnect: All configured authentication methods failed');
      });
    });
  });

  // describe('download files from sftp host', () => {
  //   const randomFiles = [];
  //   beforeAll(() => {});

  //   afterAll(() => {});

  //   describe('download all files', () => {});

  //   describe('download only files maching patterns', () => {});
  // });
});
