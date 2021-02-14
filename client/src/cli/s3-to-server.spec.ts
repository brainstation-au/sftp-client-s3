import yargs, { Arguments } from 'yargs';
import * as s3ToServer from './s3-to-server';
import * as handler from '../services/s3-to-server';
import * as s3Content from '../services/get-s3-object-content';
import { container } from '../inversify/config';
import { S3ToServerOptions } from '../types/s3-to-server-options';
import { SERVER_PARAMS } from '../inversify/constants';
jest.mock('../services/s3-to-server');
jest.mock('../services/get-s3-object-content');
const mockedHandler = handler as jest.Mocked<typeof handler>;
const mockedS3Content = s3Content as jest.Mocked<typeof s3Content>;

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
          .toThrow('Missing required arguments: host, user, private-key-s3-uri, location, bucket, s3-key');
      });

      test('with few arguments', async () => {
        await expect(parseArgs('s3-to-server --host sftphost --location /download/from/here -b test-bucket')).rejects
          .toThrow('Missing required arguments: user, private-key-s3-uri, s3-key');
      });
    });

    describe('required params are available', () => {
      let output: string;

      beforeAll(async () => {
        mockedS3Content.getS3ObjectContent.mockResolvedValue('secret-code');
        process.env['SFTP_HOST'] = 'sftphost';
        process.env['SFTP_USER'] = 'test_user';
        process.env['S3_KEY'] = 'upload/here/filename.txt';
        process.env['FILENAME'] = 'something.txt';

        output = await parseArgs(
          's3-to-server --port 22 --private-key-s3-uri s3-uri --location /download/from/here -b test-bucket --gzip'
        );
      });

      afterAll(() => {
        mockedHandler.s3ToServer.mockReset();
        mockedS3Content.getS3ObjectContent.mockReset();
        delete process.env['SFTP_HOST'];
        delete process.env['SFTP_USER'];
        delete process.env['S3_KEY'];
        delete process.env['FILENAME'];
      });

      test('resolves successfully', () => {
        expect(output).toEqual('');
      });

      test('options are available in global container', () => {
        expect(container.get<S3ToServerOptions>(SERVER_PARAMS)).toEqual(expect.objectContaining({
          host: 'sftphost',
          port: 22,
          username: 'test_user',
          privateKey: 'secret-code',
          location: '/download/from/here',
          filename: 'something.txt',
        }));
      });

      test('calls handler with arguments', async () => {
        expect(mockedHandler.s3ToServer).toHaveBeenCalledTimes(1);
        expect(mockedHandler.s3ToServer).toHaveBeenCalledWith(expect.objectContaining({
          host: 'sftphost',
          port: 22,
          user: 'test_user',
          privateKey: 'secret-code',
          location: '/download/from/here',
          bucket: 'test-bucket',
          s3Key: 'upload/here/filename.txt',
          gzip: true,
          rm: false,
          filename: 'something.txt',
        }));
      });
    });
  });
});
