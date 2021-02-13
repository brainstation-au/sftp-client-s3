import { Boolean, Record, Static, String } from 'runtypes';
import { ServerParams } from './server-params';

export const ServerToS3Options = Record({
  bucket: String,
  keyPrefix: String,
  gunzip: Boolean,
})
  .And(ServerParams);

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ServerToS3Options = Static<typeof ServerToS3Options>;
