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
  const localPaths = await downloadFromSftpServer(options, localDir);

  const {bucket, keyPrefix} = options;
  const normalisedKeyPrefix = moment().tz('utc').format(keyPrefix);
  for (const localPath of localPaths) {
    await uploadToS3(localPath, bucket, `${normalisedKeyPrefix}${path.basename(localPath)}`);
  }
};
