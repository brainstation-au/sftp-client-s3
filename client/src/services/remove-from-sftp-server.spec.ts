import * as fs from 'fs';
import * as path from 'path';
import { removeFromSftpServer } from './remove-from-sftp-server';

describe('removeFromSftpServer', () => {
  const remoteLocation = '/download';
  const hostDir = path.join(process.env['HOST_VOLUME'] || '', remoteLocation);
  const filename = 'foo.txt';
  const content = 'Hello World!\n';

  beforeAll(() => {
    fs.writeFileSync(path.join(hostDir, filename), content);
  });

  test('removes file from sftp server', async () => {
    await expect(removeFromSftpServer({
      host: process.env['SFTP_HOST_NAME'] || '',
      port: 22,
      username: 'rsa_user',
      privateKey: fs.readFileSync('/root/.ssh/id_rsa', 'utf-8'),
      location: remoteLocation,
    }, filename)).resolves.toEqual('Successfully deleted /download/foo.txt');
  });
});