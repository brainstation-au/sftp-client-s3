import { Arguments, Argv, MiddlewareFunction } from 'yargs';
import { container } from '../inversify/config';
import { SERVER_PARAMS } from '../inversify/constants';
import { getS3ObjectContent } from '../services/get-s3-object-content';
import { s3ToServer } from '../services/s3-to-server';
import { S3ToServerOptions } from '../types/s3-to-server-options';
import { ServerParams } from '../types/server-params';

export const command = 's3-to-server';

export const description = 'Get a file from S3 and upload that on the SFTP server';

export const builder = (yargs: Argv<unknown>): Argv<unknown> => yargs
  .option('host', {
    alias: ['sftp-host', 'h'],
    default: process.env['SFTP_HOST'],
    demandOption: !('SFTP_HOST' in process.env),
    description: 'SFTP host IP address or URL',
    nargs: 1,
    requiresArg: true,
    type: 'string',
  })
  .option('port', {
    alias: ['sftp-port', 'p'],
    default: +(process.env['SFTP_PORT'] || 22),
    description: 'SFTP host port number',
    nargs: 1,
    type: 'number',
  })
  .option('user', {
    alias: ['sftp-user', 'username', 'u'],
    default: process.env['SFTP_USER'],
    demandOption: !('SFTP_USER' in process.env),
    description: 'SFTP username',
    nargs: 1,
    requiresArg: true,
    type: 'string',
  })
  .option('private-key-s3-uri', {
    default: process.env['PRIVATE_KEY_S3_URI'],
    demandOption: !('PRIVATE_KEY_S3_URI' in process.env),
    description: 'S3 URI for the private key to authenticate SFTP session',
    nargs: 1,
    requiresArg: true,
    type: 'string',
  })
  .option('location', {
    alias: ['remote-location', 'l'],
    default: process.env['REMOTE_LOCATION'],
    demandOption: !('REMOTE_LOCATION' in process.env),
    description: 'Path to the file location in SFTP server',
    nargs: 1,
    requiresArg: true,
    type: 'string',
  })
  .option('filename', {
    alias: ['f'],
    default: process.env['FILENAME'],
    description: 'Expected name of the file in SFTP server',
    nargs: 1,
    type: 'string',
  })
  .option('bucket', {
    alias: ['bucket-name', 'b'],
    default: process.env['BUCKET_NAME'],
    demandOption: !('BUCKET_NAME' in process.env),
    description: 'S3 bucket name',
    nargs: 1,
    requiresArg: true,
    type: 'string',
  })
  .option('s3-key', {
    default: process.env['S3_KEY'],
    demandOption: !('S3_KEY' in process.env),
    description: 'S3 key for the file to upload',
    nargs: 1,
    requiresArg: true,
    type: 'string',
  })
  .option('remove', {
    alias: ['rm', 'r', 'delete'],
    default: process.env['DELETE_REMOTE'] === 'true' || false,
    description: 'Delete remote file (if exists) before upload from S3',
    type: 'boolean',
  })
  .option('gzip', {
    alias: ['compress'],
    default: process.env['COMPRESS'] === 'true' || false,
    description: 'Compress file content if the filename does not have a `.gz` extension',
    type: 'boolean',
  });

const downloadPrivateKey: MiddlewareFunction<unknown> = async (argv) => {
  const privateKey = typeof argv.privateKeyS3Uri === 'string' ? await getS3ObjectContent(argv.privateKeyS3Uri) : null;
  return {...argv, privateKey};
};

export const middlewares = [
  downloadPrivateKey,
];

export const handler = async (argv: Arguments<unknown>): Promise<void> => {
  const { host, port, username, privateKey, location, filename } = ServerParams.check(argv);
  container.bind<ServerParams>(SERVER_PARAMS).toConstantValue({ host, port, username, privateKey, location, filename });

  const { bucket, s3Key, gzip, rm } = S3ToServerOptions.check(argv);
  return s3ToServer({ bucket, s3Key, gzip, rm });
};
