import { Boolean, Record, Static, String } from 'runtypes';

export const S3ToServerOptions = Record({
  bucket: String,
  s3Key: String,
  gzip: Boolean,
  rm: Boolean,
});

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type S3ToServerOptions = Static<typeof S3ToServerOptions>;
