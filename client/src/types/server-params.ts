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

export type ServerParams = Static<typeof ServerParams>;
