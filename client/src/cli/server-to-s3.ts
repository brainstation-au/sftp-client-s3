import { Arguments, Argv } from 'yargs';
import { serverToS3 } from '../services/server-to-s3';
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
  .option('remove', {
    alias: ['rm', 'r', 'delete'],
    default: process.env['DELETE_REMOTE'] === 'true' || false,
    description: 'Delete remote files after successfull upload to S3',
    type: 'boolean',
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
  .option('key-prefix-format', {
    alias: ['s3-key-prefix-format'],
    default: process.env['KEY_PREFIX_FORMAT'],
    demandOption: !('KEY_PREFIX_FORMAT' in process.env),
    description: 'A [moment format](https://momentjs.com/docs/#/displaying/format/) of S3 key prefix to upload the file',
    nargs: 1,
    requiresArg: true,
    type: 'string',
  })
  .option('decrypt', {
    alias: ['d'],
    default: process.env['DECRYPT'] === 'true' || false,
    description: 'Decrypt file content with GPG private key',
    type: 'boolean',
    implies: ['gpg-private-key'],
  })
  .option('gpg-private-key', {
    default: process.env['GPG_PRIVATE_KEY'],
    description: 'GPG private key to decrypt file content',
    nargs: 1,
    type: 'string',
  });

export const handler = async (argv: Arguments): Promise<void> => {
  const options = ServerToS3Options.check(argv);
  return serverToS3(options);
};
