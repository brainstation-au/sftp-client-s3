import * as path from 'path';
import moment from 'moment-timezone';
import { ServerToS3Options } from '../types/server-to-s3-options';
import { downloadFromSftpServer } from './download-from-sftp-server';
import { uploadToS3 } from './upload-to-s3';

export const serverToS3 = async (options: ServerToS3Options): Promise<void> => {
  const {bucket, keyPrefix} = options;
  const keyPrefixWithDate = moment().tz('utc').format(keyPrefix);
  const localPaths = await downloadFromSftpServer(options);
  for (const localPath of localPaths) {
    await uploadToS3(localPath, bucket, `${keyPrefixWithDate}${path.basename(localPath)}`);
  }
};
