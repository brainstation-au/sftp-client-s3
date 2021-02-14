import * as fs from 'fs';
import * as path from 'path';
import { uploadToSftpServer } from './upload-to-sftp-server';

describe('uploadToSftpServer', () => {
  const contentPath = '/upload';
  const hostPath = path.join(process.env['HOST_VOLUME'] || '', contentPath);
  const localPath = '/tmp/upload/foo.txt';
  const content = 'Hello World!\n';

  beforeAll(() => {
    fs.mkdirSync(path.dirname(localPath), {recursive: true});
    fs.writeFileSync(localPath, content);
  });

  afterAll(() => {
    fs.readdirSync(hostPath).forEach(p => fs.unlinkSync(path.join(hostPath, p)));
    fs.unlinkSync(localPath);
  });

  describe('upload a file to sftp server', () => {
    let response: string;

    beforeAll(async () => {
      response = await uploadToSftpServer({
        host: process.env['SFTP_HOST_NAME'] || '',
        port: 22,
        username: 'rsa_user',
        privateKey: fs.readFileSync('/opt/.ssh/id_rsa', 'utf-8'),
        location: contentPath,
        filename: undefined,
      }, localPath);
    });

    test('returns something', () => {
      expect(response).toEqual(`${localPath} was successfully uploaded to ${path.join(contentPath, path.basename(localPath))}!`);
    });

    test('file has been uploaded', () => {
      const files = fs.readdirSync(hostPath);
      expect(files.length).toBe(1);
      expect(files.shift()).toBe(path.basename(localPath));
    });
  });
});
