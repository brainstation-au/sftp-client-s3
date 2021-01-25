import { Record, Static, String } from 'runtypes';
import { ServerToS3Options } from '../types/server-to-s3-options';

export const Arguments = ServerToS3Options
  .And(Record({
    privateKeyS3Uri: String,
    gpgPrivateKeyS3Uri: String,
  }));

export type Arguments = Static<typeof Arguments>;
