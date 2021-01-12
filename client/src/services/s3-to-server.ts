import * as fs from 'fs';
import * as path from 'path';
import { S3ToServerOptions } from '../types/s3-to-server-options';
import { downloadFromS3 } from './download-from-s3';
import { uploadToSftpServer } from './upload-to-sftp-server';

export const s3ToServer = async (options: S3ToServerOptions): Promise<string> => {
  const { bucket, s3Key } = options;
  const localPath = path.join(fs.mkdtempSync('/tmp/'), path.basename(s3Key));
  await downloadFromS3(bucket, s3Key, localPath);
  return uploadToSftpServer(options, localPath);
};
