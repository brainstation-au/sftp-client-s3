import { Boolean, Record, Static, String } from 'runtypes';
import { ServerParams } from './server-params';

export const S3ToServerOptions = Record({
  bucket: String,
  s3Key: String,
  encrypt: Boolean,
})
  .And(ServerParams);

export type S3ToServerOptions = Static<typeof S3ToServerOptions>;
