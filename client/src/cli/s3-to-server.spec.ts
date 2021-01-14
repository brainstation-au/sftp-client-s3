import yargs, { Arguments } from 'yargs';
import * as s3ToServer from './s3-to-server';
import * as handler from '../services/s3-to-server';
jest.mock('../services/s3-to-server');
const mockedHandler = handler as jest.Mocked<typeof handler>;

describe('s3-to-server', () => {
  const parser = yargs.command(s3ToServer).help();
  const parseArgs = (args: string): Promise<string> => new Promise((resolve, reject) => {
    parser.parse(args, (err: Error | undefined, _argv: Arguments, output: string): void => {
      if (err) reject(err);
      resolve(output);
    });
  });

  describe('help', () => {
    test('basic help output on parent', async () => {
      await expect(parseArgs('--help')).resolves.toMatchSnapshot();
    });

    test('basic help output on command', async () => {
      await expect(parseArgs('s3-to-server --help')).resolves.toMatchSnapshot();
    });
  });

  describe('command options', () => {
    describe('required params are not available', () => {
      test('with no arguments', async () => {
        await expect(parseArgs('s3-to-server')).rejects
          .toThrow('Missing required arguments: host, user, key, location, bucket, s3-key');
      });

      test('with few arguments', async () => {
        await expect(parseArgs('s3-to-server --host sftphost --location /download/from/here -b test-bucket')).rejects
          .toThrow('Missing required arguments: user, key, s3-key');
      });

      describe('gpg key is required when encrypt is true in environment variable', () => {
        beforeAll(() => {
          process.env['SFTP_USER'] = 'test_user';
          process.env['PRIVATE_KEY'] = 'something';
          process.env['S3_KEY'] = 'foo/bar.txt';
          process.env['ENCRYPT'] = 'true';
        });

        afterAll(() => {
          delete process.env['SFTP_USER'];
          delete process.env['PRIVATE_KEY'];
          delete process.env['S3_KEY'];
          delete process.env['ENCRYPT'];
        });

        test('throws error', async () => {
          await expect(parseArgs('s3-to-server --host sftphost --location /download/from/here -b test-bucket')).rejects
            .toThrow('Missing dependent arguments:\n encrypt -> gpg-public-key');
        });
      });

      describe('gpg key is required when encrypt is flagged in command options', () => {
        test('throws error', async () => {
          await expect(parseArgs(
            's3-to-server -h sftphost -u test_user -k something --s3-key foo/bar.txt -e -l /download/from/here -b test-bucket'
          )).rejects
            .toThrow('Missing dependent arguments:\n encrypt -> gpg-public-key');
        });
      });
    });

    describe('required params are available', () => {
      describe('params are available through environment', () => {
        let output: string;

        beforeAll(async () => {
          mockedHandler.s3ToServer.mockResolvedValue('uploaded');
          process.env['SFTP_HOST'] = 'sftphost';
          process.env['SFTP_USER'] = 'test_user';
          process.env['S3_KEY'] = 'upload/here/filename.txt';

          output = await parseArgs('s3-to-server --port 22 --k secret-code --location /download/from/here -b test-bucket');
        });

        afterAll(() => {
          mockedHandler.s3ToServer.mockClear();
          delete process.env['SFTP_HOST'];
          delete process.env['SFTP_USER'];
          delete process.env['S3_KEY'];
        });

        test('resolves successfully', () => {
          expect(output).toEqual('');
        });

        test('calls handler with arguments', async () => {
          expect(mockedHandler.s3ToServer).toHaveBeenCalledTimes(1);
          expect(mockedHandler.s3ToServer).toHaveBeenCalledWith(expect.objectContaining({
            host: 'sftphost',
            port: 22,
            user: 'test_user',
            key: 'secret-code',
            location: '/download/from/here',
            bucket: 'test-bucket',
            s3Key: 'upload/here/filename.txt',
            encrypt: false,
          }));
        });
      });
    });
  });
});
