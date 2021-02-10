import { Record, Static, String } from 'runtypes';
import { S3ToServerOptions } from './../types/s3-to-server-options';

export const Arguments = S3ToServerOptions
  .And(Record({
    privateKeyS3Uri: String,
    gpgPublicKeyS3Uri: String,
  }));

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type Arguments = Static<typeof Arguments>;
