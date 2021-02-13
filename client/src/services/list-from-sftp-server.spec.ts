import * as fs from 'fs';
import * as path from 'path';
import { listFromSftpServer } from './list-from-sftp-server';

describe('listFromSftpServer', () => {
  const remoteLocation = '/download';
  const hostDir = path.join(process.env['HOST_VOLUME'] || '', remoteLocation);
  const randonFilename: string[] = [
    '20201221183000_foo.txt',
    '20201222183000_bar.txt',
    'baz.txt',
  ];
  const allFilename: string[] = ['unknown'].concat(randonFilename);
  const content = 'Hello World!\n';

  beforeAll(() => {
    allFilename.forEach(name => fs.writeFileSync(path.join(hostDir, name), content));
  });

  afterAll(() => {
    fs.readdirSync(hostDir).forEach(p => fs.unlinkSync(path.join(hostDir, p)));
  });

  test('downloads all files when there is no filename pattern', async () => {
    await expect(listFromSftpServer({
      host: process.env['SFTP_HOST_NAME'] || '',
      port: 22,
      username: 'rsa_user',
      privateKey: fs.readFileSync('/opt/.ssh/id_rsa', 'utf-8'),
      location: remoteLocation,
      filename: undefined,
      rm: false,
    })).resolves.toEqual(expect.arrayContaining(allFilename));
  });

  test('downloads a subset of files when there is a filename pattern 1', async () => {
    await expect(listFromSftpServer({
      host: process.env['SFTP_HOST_NAME'] || '',
      port: 22,
      username: 'rsa_user',
      privateKey: fs.readFileSync('/opt/.ssh/id_rsa', 'utf-8'),
      location: remoteLocation,
      filename: '*.txt',
      rm: false,
    })).resolves.toEqual(expect.arrayContaining(randonFilename));
  });

  test('downloads a subset of files when there is a filename pattern 2', async () => {
    await expect(listFromSftpServer({
      host: process.env['SFTP_HOST_NAME'] || '',
      port: 22,
      username: 'rsa_user',
      privateKey: fs.readFileSync('/opt/.ssh/id_rsa', 'utf-8'),
      location: remoteLocation,
      filename: '^\\d{14}_.*\.txt$',
      rm: false,
    })).resolves.toEqual(expect.arrayContaining([
      '20201221183000_foo.txt',
      '20201222183000_bar.txt',
    ]));
  });
});
