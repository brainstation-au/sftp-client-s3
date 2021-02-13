import { Record, Static, String } from 'runtypes';
import { ServerToS3Options } from '../types/server-to-s3-options';

export const Arguments = ServerToS3Options
  .And(Record({
    privateKeyS3Uri: String,
  }));

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type Arguments = Static<typeof Arguments>;
