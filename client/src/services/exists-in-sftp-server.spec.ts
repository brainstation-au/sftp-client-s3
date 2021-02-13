import * as fs from 'fs';
import * as path from 'path';
import { existsInSftpServer } from './exists-in-sftp-server';

describe('existsInSftpServer', () => {
  describe('when a file exists in location', () => {
    const filename = 'foo.txt';
    const remoteLocation = '/download';
    const hostDir = path.join(process.env['HOST_VOLUME'] || '', remoteLocation);
    const filePath = path.join(hostDir, filename);
    const content = 'Hello World!\n';

    beforeAll(() => {
      fs.writeFileSync(filePath, content, {encoding: 'utf-8'});
    });

    afterAll(() => {
      fs.unlinkSync(filePath);
    });

    test('returns true', async () => {
      await expect(existsInSftpServer({
        host: process.env['SFTP_HOST_NAME'] || '',
        port: 22,
        username: 'rsa_user',
        privateKey: fs.readFileSync('/opt/.ssh/id_rsa', 'utf-8'),
        location: remoteLocation,
        filename: undefined,
        rm: false,
      }, filename)).resolves.toEqual(true);
    });
  });

  describe('when a file does not exist in location', () => {
    const filename = 'foo.txt';
    const remoteLocation = '/download';

    test('returns true', async () => {
      await expect(existsInSftpServer({
        host: process.env['SFTP_HOST_NAME'] || '',
        port: 22,
        username: 'rsa_user',
        privateKey: fs.readFileSync('/opt/.ssh/id_rsa', 'utf-8'),
        location: remoteLocation,
        filename: undefined,
        rm: false,
      }, filename)).resolves.toEqual(false);
    });
  });
});
