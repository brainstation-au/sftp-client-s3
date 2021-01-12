import * as fs from 'fs';
import * as path from 'path';
import { downloadFromSftpServer } from './download-from-sftp-server';

describe('downloadFromSftpServer', () => {
  const contentPath = '/download';
  const hostDir = path.join(process.env['HOST_VOLUME'] || '', contentPath);
  const localDir = '/tmp/foo/';
  const randonFilename: string[] = [
    'foo.txt',
    'bar.txt',
    'baz.txt',
  ];
  const allFilename: string[] = ['unknown'].concat(randonFilename);
  const content = 'Hello World!\n';

  beforeAll(() => {
    allFilename.forEach(name => fs.writeFileSync(path.join(hostDir, name), content));
    fs.mkdirSync(localDir, {recursive: true});
  });

  afterAll(() => {
    fs.readdirSync(hostDir).forEach(p => fs.unlinkSync(path.join(hostDir, p)));
    fs.readdirSync(localDir).forEach(p => fs.unlinkSync(path.join(localDir, p)));
  });

  test('downloads all files when there is no filename pattern', async () => {
    await expect(downloadFromSftpServer({
      host: process.env['SFTP_HOST_NAME'] || '',
      port: 22,
      username: 'rsa_user',
      privateKey: fs.readFileSync('/root/.ssh/id_rsa', 'utf-8'),
      location: contentPath,
      filename: undefined,
    }, localDir)).resolves.toEqual(expect.arrayContaining(allFilename.map(f => path.join(localDir, f))));
  });

  test('downloads a subset of files when there is a filename pattern', async () => {
    await expect(downloadFromSftpServer({
      host: process.env['SFTP_HOST_NAME'] || '',
      port: 22,
      username: 'rsa_user',
      privateKey: fs.readFileSync('/root/.ssh/id_rsa', 'utf-8'),
      location: contentPath,
      filename: '*.txt',
    }, localDir)).resolves.toEqual(expect.arrayContaining(randonFilename.map(f => path.join(localDir, f))));
  });
});
