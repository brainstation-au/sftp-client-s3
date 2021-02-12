import { Arguments, Argv, MiddlewareFunction } from 'yargs';
import { container } from '../inversify/config';
import { S3_TO_SERVER_OPTIONS } from '../inversify/constants';
import { getS3ObjectContent } from '../services/get-s3-object-content';
import { s3ToServer } from '../services/s3-to-server';
import { S3ToServerOptions } from '../types/s3-to-server-options';
import { Arguments as S3ToServerArguments } from './s3-to-server-arguments';

export const command = 's3-to-server';

export const description = 'Get a file from S3 and upload that on the SFTP server';

export const builder = (yargs: Argv<unknown>): Argv<Partial<S3ToServerArguments>> => yargs
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
  .option('override', {
    default: process.env['OVERRIDE'] === 'true' || false,
    description: 'Override a file in SFTP server if already exists',
    type: 'boolean',
  })
  .option('gzip', {
    alias: ['compress'],
    default: process.env['COMPRESS'] === 'true' || false,
    description: 'Compress file content if not already compressed',
    type: 'boolean',
  })
  .option('encrypt', {
    alias: ['e'],
    default: process.env['ENCRYPT'] === 'true' || false,
    description: 'Encrypt file content with GPG public key',
    type: 'boolean',
    implies: ['gpg-public-key-s3-uri'],
  })
  .option('gpg-public-key-s3-uri', {
    default: process.env['GPG_PUBLIC_KEY_S3_URI'],
    description: 'S3 URI of the GPG public key to encrypt file content',
    nargs: 1,
    type: 'string',
  });

const downloadPrivateKey: MiddlewareFunction<Partial<S3ToServerArguments>> = async (argv) => {
  const privateKey = argv.privateKeyS3Uri && await getS3ObjectContent(argv.privateKeyS3Uri);
  return {...argv, privateKey};
};

const downloadGpgPublicKey: MiddlewareFunction<Partial<S3ToServerArguments>> = async (argv) => {
  const gpgPublicKey = argv.gpgPublicKeyS3Uri && await getS3ObjectContent(argv.gpgPublicKeyS3Uri);
  return {...argv, gpgPublicKey};
};

export const middlewares = [
  downloadPrivateKey,
  downloadGpgPublicKey,
];

export const handler = async (argv: Arguments<Partial<S3ToServerArguments>>): Promise<void> => {
  const options = S3ToServerOptions.check(argv);
  container.bind<S3ToServerOptions>(S3_TO_SERVER_OPTIONS).toConstantValue(options);
  return s3ToServer(options);
};
