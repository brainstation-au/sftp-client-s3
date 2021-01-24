import { Boolean, Literal, Number, Partial, Record, Static, String } from 'runtypes';
import { ServerParams } from './server-params';
import moment from 'moment-timezone';

export const ServerToS3Options = Record({
  bucket: String,
  keyPrefixPattern: String,
  timezone: String.withConstraint(s => !!moment.tz.zone(s) || `${s} is not a valid timezone`),
})
  .And(Partial({
    rm: Boolean,
  }))
  .And(Record({
    decrypt: Literal(false),
  }).Or(Record({
    decrypt: Literal(true),
    gpgPrivateKey: String,
    passphrase: String,
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

export type ServerToS3Options = Static<typeof ServerToS3Options>;
