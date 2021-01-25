import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { S3ToServerOptions } from '../types/s3-to-server-options';
import { downloadFromS3 } from './download-from-s3';
import { localStorageLocation } from './local-storage-location';
import { encrypt } from './openpgp';
import { uploadToSftpServer } from './upload-to-sftp-server';

export const s3ToServer = async (options: S3ToServerOptions): Promise<string> => {
  const { bucket, s3Key } = options;
  const filename = path.basename(s3Key);
  const isGzipped = path.extname(filename).toLowerCase() === '.gz';
  const localDir = localStorageLocation();
  const localPath = path.join(localDir, filename);

  await downloadFromS3(bucket, s3Key, localPath);
  console.log(`s3://${bucket}/${s3Key} has been downloaded as ${localPath}`);

  if (options.encrypt) {
    const fileContent: Buffer = fs.readFileSync(localPath);
    const clearContent: Buffer = isGzipped ? zlib.gunzipSync(fileContent) : fileContent;
    const encClearContent: string = await encrypt(clearContent.toString(), options.gpgPublicKey);
    const encContent: Buffer = isGzipped ? zlib.gzipSync(Buffer.from(encClearContent)) : Buffer.from(encClearContent);
    fs.writeFileSync(localPath, encContent);
  }

  let uploadPath = localPath;
  if (!isGzipped && options.gzip) {
    uploadPath = localPath + '.gz';
    fs.writeFileSync(uploadPath, zlib.gzipSync(fs.readFileSync(localPath)));
  }

  return uploadToSftpServer(options, uploadPath);
};
