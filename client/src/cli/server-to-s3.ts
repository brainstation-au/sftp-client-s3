import { Arguments, Argv } from 'yargs';
import { serverToS3 } from '../sftp/server-to-s3';
import { ServerToS3Options } from '../types/server-to-s3-options';

export const command = 'server-to-s3';

export const description = 'Download files from SFTP server and put them in S3 bucket';

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
    default: process.env['SFTP_PORT'],
    demandOption: !('SFTP_PORT' in process.env),
    description: 'SFTP host port number',
    nargs: 1,
    requiresArg: true,
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
  .option('filename', {
    alias: ['filename-pattern', 'f'],
    default: process.env['FILENAME'],
    description: 'Name of the file or a regular expression to find a subset',
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
  .option('key-prefix', {
    alias: ['s3-key-prefix', 's3-key'],
    default: process.env['KEY_PREFIX'],
    demandOption: !('KEY_PREFIX' in process.env),
    description: 'S3 key prefix to upload the file',
    nargs: 1,
    requiresArg: true,
    type: 'string',
  })
  .option('decrypt', {
    alias: ['d'],
    default: process.env['DECRYPT'] || false,
    description: 'Decrypt file content with PGP private key',
    type: 'boolean',
  });

export const handler = async (argv: Arguments): Promise<void> => {
  const options = ServerToS3Options.check(argv);
  return serverToS3(options);
};
