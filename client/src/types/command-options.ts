import { Static } from 'runtypes';
import { S3ToServerOptions } from './s3-to-server-options';
import { ServerToS3Options } from './server-to-s3-options';

export const CommandOptions = S3ToServerOptions.Or(ServerToS3Options);

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type CommandOptions = Static<typeof CommandOptions>;
