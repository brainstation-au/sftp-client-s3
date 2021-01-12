import yargs, { Arguments } from 'yargs';
import * as serverToS3 from './server-to-s3';
import * as handler from '../services/server-to-s3';
jest.mock('../services/server-to-s3');
const mockedHandler = handler as jest.Mocked<typeof handler>;

describe('server-to-s3', () => {
  const parser = yargs.command(serverToS3).help();
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
      await expect(parseArgs('server-to-s3 --help')).resolves.toMatchSnapshot();
    });
  });

  describe('command options', () => {
    describe('required params are not available', () => {
      test('with no arguments', async () => {
        await expect(parseArgs('server-to-s3')).rejects
          .toThrow('Missing required arguments: host, user, key, location, bucket, key-prefix');
      });

      test('with few arguments', async () => {
        await expect(parseArgs('server-to-s3 --host sftphost --location /download/from/here -b test-bucket')).rejects
          .toThrow('Missing required arguments: user, key, key-prefix');
      });
    });

    describe('required params are available', () => {
      describe('params are available through environment', () => {
        let output: string;

        beforeAll(async () => {
          mockedHandler.serverToS3.mockResolvedValue();
          process.env['SFTP_HOST'] = 'sftphost';
          process.env['SFTP_USER'] = 'test_user';
          process.env['KEY_PREFIX'] = 'upload/here';

          output = await parseArgs('server-to-s3 --port 22 --k secret-code --location /download/from/here -b test-bucket');
        });

        afterAll(() => {
          mockedHandler.serverToS3.mockClear();
          delete process.env['SFTP_HOST'];
          delete process.env['SFTP_USER'];
          delete process.env['KEY_PREFIX'];
        });

        test('resolves successfully', () => {
          expect(output).toEqual('');
        });

        test('calls handler with arguments', async () => {
          expect(mockedHandler.serverToS3).toHaveBeenCalledTimes(1);
          expect(mockedHandler.serverToS3).toHaveBeenCalledWith(expect.objectContaining({
            host: 'sftphost',
            port: 22,
            user: 'test_user',
            key: 'secret-code',
            location: '/download/from/here',
            filename: undefined,
            bucket: 'test-bucket',
            keyPrefix: 'upload/here',
            decrypt: false,
          }));
        });
      });
    });
  });
});
