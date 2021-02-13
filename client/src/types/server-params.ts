import { Boolean, Number, Record, Static, String, Undefined } from 'runtypes';

export const ServerParams = Record({
  host: String,
  port: Number,
  username: String,
  privateKey: String,
  location: String,
  filename: String.Or(Undefined),
  rm: Boolean,
});

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ServerParams = Static<typeof ServerParams>;
