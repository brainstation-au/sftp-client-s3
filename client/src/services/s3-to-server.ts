import * as fs from 'fs';
import * as path from 'path';
import { S3ToServerOptions } from '../types/s3-to-server-options';
import { downloadFromS3 } from './download-from-s3';
import { localStorageLocation } from './local-storage-location';
import { uploadToSftpServer } from './upload-to-sftp-server';
import { compress } from './gzip';
import { existsInSftpServer } from './exists-in-sftp-server';
import { removeFromSftpServer } from './remove-from-sftp-server';
import { remoteFilename } from './remote-filename';

export const s3ToServer = async (options: S3ToServerOptions): Promise<void> => {
  const { bucket, s3Key } = options;
  const filename = path.basename(s3Key);
  const isGzipped = path.extname(filename).toLowerCase() === '.gz';
  const localDir = localStorageLocation();
  const localPath = path.join(localDir, filename);

  await downloadFromS3(bucket, s3Key, localPath);
  console.log(`s3://${bucket}/${s3Key} has been downloaded as ${localPath}`);

  let uploadPath = localPath;
  if (!isGzipped && options.gzip) {
    uploadPath = localPath + '.gz';
    await compress(localPath, uploadPath);
    fs.unlinkSync(localPath);
  }

  if (options.rm) {
    // TODO: create a function for remotePath.
    const remoteFile = remoteFilename(uploadPath, options.filename);
    const alreadyExists = await existsInSftpServer(options, remoteFile);
    if (alreadyExists) {
      await removeFromSftpServer(options, remoteFile);
    }
  }

  const uploadResponse = await uploadToSftpServer(options, uploadPath);
  console.log(uploadResponse);
  fs.unlinkSync(uploadPath);
};
