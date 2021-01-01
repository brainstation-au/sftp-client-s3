import yargs, { Arguments } from 'yargs';
import * as s3ToServer from './s3-to-server';
import * as handler from '../sftp/s3-to-server';
jest.mock('../sftp/s3-to-server');
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
          .toThrow('Missing required arguments: host, port, user, key, location, bucket, s3-key');
      });

      test('with few arguments', async () => {
        await expect(parseArgs('s3-to-server --host sftphost --location /download/from/here -b test-bucket')).rejects
          .toThrow('Missing required arguments: port, user, key, s3-key');
      });
    });

    describe('required params are available', () => {
      describe('params are available through environment', () => {
        let output: string;

        beforeAll(async () => {
          mockedHandler.s3ToServer.mockResolvedValue();
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
