import { Boolean, Literal, Partial, Record, Static, String } from 'runtypes';
import { ServerParams } from './server-params';

export const S3ToServerOptions = Record({
  bucket: String,
  s3Key: String,
  encrypt: Boolean,
  override: Boolean,
})
  .And(Record({
    encrypt: Literal(false),
  }).Or(Record({
    encrypt: Literal(true),
    gpgPublicKey: String,
  })))
  .And(ServerParams)
  .And(Partial({
    gzip: Boolean,
  }));

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type S3ToServerOptions = Static<typeof S3ToServerOptions>;
