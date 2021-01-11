import * as path from 'path';
import * as fs from 'fs';
import { downloadFromSftpServer } from './server-to-s3';

describe('server-to-s3', () => {
  describe('downloadFromSftpServer', () => {
    const contentPath = '/download';
    const hostPath = path.join(process.env['HOST_VOLUME'] || '', contentPath);
    const randonFilename: string[] = [
      'foo.txt',
      'bar.txt',
      'baz.txt',
    ];
    const allFilename: string[] = ['unknown'].concat(randonFilename);
    const content = 'Hello World!';

    beforeAll(() => {
      allFilename.forEach(name => fs.writeFileSync(path.join(hostPath, name), content));
    });

    afterAll(() => {
      fs.readdirSync(hostPath).forEach(p => fs.unlinkSync(path.join(hostPath, p)));
    });

    describe('downloads files from sftp server', () => {
      describe('all files', () => {
        const storageLocation = '/tmp/location/';
        let localPaths: string[];

        beforeAll(async () => {
          process.env['STORAGE_LOCATION'] = storageLocation;
          localPaths = await downloadFromSftpServer({
            host: process.env['SFTP_HOST_NAME'] || '',
            port: 22,
            username: 'rsa_user',
            privateKey: fs.readFileSync('/root/.ssh/id_rsa', 'utf-8'),
            location: contentPath,
            filename: undefined,
          });
        });

        afterAll(() => {
          delete process.env['STORAGE_LOCATION'];
        });

        test('returns a list of local paths', () => {
          expect(localPaths.length).toEqual(allFilename.length);
        });

        test('local paths start with storage location', () => {
          localPaths.forEach(p => expect(p).toEqual(expect.stringMatching(`^${storageLocation}?`)));
        });

        test('local paths end with actual file name', () => {
          expect(localPaths.map(p => path.basename(p))).toEqual(expect.arrayContaining(allFilename));
        });
      });
    });
  });
});
