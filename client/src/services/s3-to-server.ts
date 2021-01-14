import * as fs from 'fs';
import * as path from 'path';
import { S3ToServerOptions } from '../types/s3-to-server-options';
import { downloadFromS3 } from './download-from-s3';
import { localStorageLocation } from './local-storage-location';
import { encrypt } from './openpgp';
import { uploadToSftpServer } from './upload-to-sftp-server';

export const s3ToServer = async (options: S3ToServerOptions): Promise<string> => {
  const { bucket, s3Key } = options;
  const filename = path.basename(s3Key);
  const localDir = localStorageLocation();
  const localPath = path.join(localDir, filename);

  await downloadFromS3(bucket, s3Key, localPath);

  let uploadDir = localDir;
  if (options.encrypt) {
    uploadDir = localStorageLocation();
    const clearContent = fs.readFileSync(localPath, 'utf-8');
    const encryptedContent = await encrypt(clearContent, options.gpgPublicKey);
    fs.writeFileSync(path.join(uploadDir, filename), encryptedContent, {encoding: 'utf-8'});
  }

  return uploadToSftpServer(options, path.join(uploadDir, filename));
};
