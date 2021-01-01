import { Boolean, Number, Partial, Record, Static, String } from 'runtypes';

export const ServerToS3Options = Record({
  host: String,
  port: Number,
  user: String,
  key: String,
  location: String,
  filename: String,
  bucket: String,
  keyPrefix: String,
  decrypt: Boolean,
}).And(
  Record({
    count: Number,
  }).Or(Partial({
    minCount: Number,
    maxCount: Number,
  }))
);

export type ServerToS3Options = Static<typeof ServerToS3Options>;
