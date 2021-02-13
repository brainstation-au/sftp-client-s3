import { Boolean, Number, Record, String, Undefined } from 'runtypes';

export const CommandOptions = Record({
  host: String,
  port: Number,
  username: String,
  privateKey: String,
  location: String,
  filename: String.Or(Undefined),
  rm: Boolean,
  bucket: String,
}).And(Record({
  s3Key: String,
  gzip: Boolean,
}).Or(Record({
  keyPrefix: String,
  gunzip: Boolean,
})));
