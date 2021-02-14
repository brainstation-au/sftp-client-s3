import * as fs from 'fs';
import * as path from 'path';
import { container } from '../inversify/config';
import { S3ToServerOptions } from '../types/s3-to-server-options';
import { downloadFromS3 } from './download-from-s3';
import { compress } from './gzip';
import { localStorageLocation } from './local-storage-location';
import { SftpService } from './sftp';

export const s3ToServer = async ({bucket, s3Key, gzip, rm}: S3ToServerOptions): Promise<void> => {
  const sftp = container.get<SftpService>(SftpService);
  const filename = path.basename(s3Key);
  const isGzipped = path.extname(filename).toLowerCase() === '.gz';
  const localDir = localStorageLocation();
  const localPath = path.join(localDir, filename);

  await downloadFromS3(bucket, s3Key, localPath);
  console.log(`s3://${bucket}/${s3Key} has been downloaded as ${localPath}`);

  let uploadPath = localPath;
  if (!isGzipped && gzip) {
    uploadPath = localPath + '.gz';
    await compress(localPath, uploadPath);
    fs.unlinkSync(localPath);
  }

  if (rm) {
    const remoteName = path.basename(uploadPath);
    const alreadyExists = await sftp.exists(remoteName);
    if (alreadyExists) {
      await sftp.delete(remoteName);
    }
  }

  const uploadResponse = await sftp.upload(uploadPath);
  console.log(uploadResponse);
  fs.unlinkSync(uploadPath);
};
