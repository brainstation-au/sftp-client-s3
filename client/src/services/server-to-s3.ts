import * as fs from 'fs';
import * as path from 'path';
import moment from 'moment-timezone';
import { ServerToS3Options } from '../types/server-to-s3-options';
import { downloadFromSftpServer } from './download-from-sftp-server';
import { uploadToS3 } from './upload-to-s3';

export const serverToS3 = async (options: ServerToS3Options): Promise<void> => {
  const storageLocation = process.env['STORAGE_LOCATION'] || '/tmp/';
  fs.mkdirSync(storageLocation, {recursive: true});
  const localDir = fs.mkdtempSync(storageLocation);
  const files = await downloadFromSftpServer(options, localDir);

  const {bucket, keyPrefix} = options;
  const normalisedKeyPrefix = moment().tz('utc').format(keyPrefix);
  for (const file of files) {
    await uploadToS3(path.join(localDir, file), bucket, `${normalisedKeyPrefix}${file}`);
  }
};
