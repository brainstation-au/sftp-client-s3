import { Boolean, Literal, Record, Static, String } from 'runtypes';
import { ServerParams } from './server-params';

export const S3ToServerOptions = Record({
  bucket: String,
  s3Key: String,
  encrypt: Boolean,
})
  .And(Record({
    encrypt: Literal(false),
  }).Or(Record({
    encrypt: Literal(true),
    gpgPublicKey: String,
  })))
  .And(ServerParams);

export type S3ToServerOptions = Static<typeof S3ToServerOptions>;
