import { Boolean, Number, Partial, Record, Static, String } from 'runtypes';
import { ServerParams } from './server-params';

export const ServerToS3Options = Record({
  bucket: String,
  keyPrefix: String,
})
  .And(Partial({
    rm: Boolean,
    gunzip: Boolean,
  }))
  .And(ServerParams)
  .And(
    Record({
      count: Number,
    }).Or(Partial({
      minCount: Number,
      maxCount: Number,
    }))
  );

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ServerToS3Options = Static<typeof ServerToS3Options>;
