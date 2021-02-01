import * as fs from 'fs';
import * as path from 'path';
import { ServerParams } from '../types/server-params';
import { downloadFromSftpServer } from './download-from-sftp-server';

describe('downloadFromSftpServer', () => {
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
  });

  afterAll(() => {
    fs.readdirSync(hostDir).forEach(p => fs.unlinkSync(path.join(hostDir, p)));
    fs.readdirSync(localDir).forEach(p => fs.unlinkSync(path.join(localDir, p)));
  });

  test('downloads a file from SFTP server to local file system', async () => {
    await expect(downloadFromSftpServer({
      host: process.env['SFTP_HOST_NAME'] || '',
      port: 22,
      username: 'rsa_user',
      privateKey: fs.readFileSync('/root/.ssh/id_rsa', 'utf-8'),
    } as ServerParams, remotePath, localPath)).resolves.toEqual(`${remotePath} was successfully download to ${localPath}!`);
  });
});
