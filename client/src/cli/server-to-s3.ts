import * as path from 'path';
import { Arguments, Argv, MiddlewareFunction } from 'yargs';
import { getS3ObjectContent } from '../services/get-s3-object-content';
import { serverToS3 } from '../services/server-to-s3';
import { ServerToS3Options } from '../types/server-to-s3-options';
import { Arguments as ServerToS3Arguments } from './server-to-s3-arguments';

export const command = 'server-to-s3';

export const description = 'Download files from SFTP server and put them in S3 bucket';

export const builder = (yargs: Argv<unknown>): Argv<Partial<ServerToS3Arguments>> => yargs
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
  .option('key-prefix-pattern', {
    alias: ['s3-key-prefix-pattern'],
    default: process.env['KEY_PREFIX_PATTERN'],
    demandOption: !('KEY_PREFIX_PATTERN' in process.env),
    description: 'A string to pass through [moment format](https://momentjs.com/docs/#/displaying/format/) to get S3 key prefix',
    nargs: 1,
    requiresArg: true,
    type: 'string',
  })
  .option('timezone', {
    default: process.env['TIMEZONE'] || 'UTC',
    description: 'Name of the timezone to translate key-prefix-pattern',
    nargs: 1,
    requiresArg: true,
    type: 'string',
  })
  .option('decrypt', {
    alias: ['d'],
    default: process.env['DECRYPT'] === 'true' || false,
    description: 'Decrypt file content with GPG private key',
    type: 'boolean',
    implies: ['gpg-private-key-s3-uri'],
  })
  .option('gunzip', {
    alias: ['uncompress'],
    default: process.env['UNCOMPRESS'] === 'true' || false,
    description: 'Uncompress file content if compressed',
    type: 'boolean',
  })
  .option('gpg-private-key-s3-uri', {
    default: process.env['GPG_PRIVATE_KEY_S3_KEY'],
    description: 'S3 URI of the GPG private key to decrypt file content',
    nargs: 1,
    type: 'string',
  })
  .option('gpg-passphrase', {
    alias: ['gpg-password'],
    default: process.env['GPG_PASSPHRASE'],
    description: 'Passphrase to decrypt GPG private key',
    nargs: 1,
    type: 'string',
  });

const downloadPrivateKey: MiddlewareFunction<Partial<ServerToS3Arguments>> = async (argv) => {
  const privateKey = argv.privateKeyS3Uri && await getS3ObjectContent(argv.privateKeyS3Uri);
  return {...argv, privateKey};
};

const downloadGpgPrivateKey: MiddlewareFunction<Partial<ServerToS3Arguments>> = async (argv) => {
  const gpgPrivateKey = argv.gpgPrivateKeyS3Uri && await getS3ObjectContent(argv.gpgPrivateKeyS3Uri);
  return {...argv, gpgPrivateKey};
};

export const middlewares = [
  downloadPrivateKey,
  downloadGpgPrivateKey,
];

export const handler = async (argv: Arguments<Partial<ServerToS3Arguments>>): Promise<void> => {
  console.log(`Options submitted with ${path.parse(__filename).name}:`, JSON.stringify(argv));
  const options = ServerToS3Options.check(argv);
  return serverToS3(options);
};
