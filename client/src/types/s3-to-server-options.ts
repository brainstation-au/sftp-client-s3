import { Boolean, Record, Static, String, Number } from 'runtypes';

export const S3ToServerOptions = Record({
  host: String,
  port: Number,
  user: String,
  key: String,
  location: String,
  bucket: String,
  s3Key: String,
  encrypt: Boolean,
});

export type S3ToServerOptions = Static<typeof S3ToServerOptions>;
