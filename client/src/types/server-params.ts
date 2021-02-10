import { Record, Static, String, Number, Undefined, Partial } from 'runtypes';

export const ServerParams = Record({
  host: String,
  port: Number,
  username: String,
  privateKey: String,
  location: String,
})
  .And(Partial({
    filename: String.Or(Undefined),
  }));

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ServerParams = Static<typeof ServerParams>;
