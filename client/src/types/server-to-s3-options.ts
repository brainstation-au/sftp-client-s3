import { Boolean, Record, Static, String } from 'runtypes';

export const ServerToS3Options = Record({
  bucket: String,
  keyPrefix: String,
  gunzip: Boolean,
  rm: Boolean,
});

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ServerToS3Options = Static<typeof ServerToS3Options>;
