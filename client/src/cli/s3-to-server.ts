import { Arguments, Argv } from 'yargs';
import { s3ToServer } from '../services/s3-to-server';
import { S3ToServerOptions } from '../types/s3-to-server-options';

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
    default: process.env['SFTP_PORT'] || 22,
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
  .option('key', {
    alias: ['private-key', 'k'],
    default: process.env['PRIVATE_KEY'],
    demandOption: !('PRIVATE_KEY' in process.env),
    description: 'Private key to authenticate SFTP session',
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
  .option('encrypt', {
    alias: ['e'],
    default: process.env['ENCRYPT'] === 'true' || false,
    description: 'Encrypt file content with GPG public key',
    type: 'boolean',
    implies: ['gpg-public-key'],
  })
  .option('gpg-public-key', {
    default: process.env['GPG_PUBLIC_KEY'],
    description: 'GPG public key to encrypt file content',
    nargs: 1,
    type: 'string',
  });

export const handler = (argv: Arguments): Promise<string> => {
  const options = S3ToServerOptions.check(argv);
  return s3ToServer(options);
};
