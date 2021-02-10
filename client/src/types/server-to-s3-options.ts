import { Boolean, Literal, Number, Partial, Record, Static, String, Undefined } from 'runtypes';
import { ServerParams } from './server-params';
import moment from 'moment-timezone';

export const ServerToS3Options = Record({
  bucket: String,
  keyPrefixPattern: String,
  timezone: String.withConstraint(s => !!moment.tz.zone(s) || `${s} is not a valid timezone`),
})
  .And(Partial({
    rm: Boolean,
    gunzip: Boolean,
  }))
  .And(Record({
    decrypt: Literal(false),
  }).Or(Record({
    decrypt: Literal(true),
    gpgPrivateKey: String,
    gpgPassphrase: String.Or(Undefined),
  })))
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
