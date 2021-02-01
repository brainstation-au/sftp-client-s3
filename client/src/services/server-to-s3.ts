import * as fs from 'fs';
import moment from 'moment-timezone';
import * as path from 'path';
import * as zlib from 'zlib';
import { ServerToS3Options } from '../types/server-to-s3-options';
import { downloadFromSftpServer } from './download-from-sftp-server';
import { listFromSftpServer } from './list-from-sftp-server';
import { uncompress } from './gzip';
import { localStorageLocation } from './local-storage-location';
import { decrypt } from './openpgp';
import { removeFromSftpServer } from './remove-from-sftp-server';
import { uploadToS3 } from './upload-to-s3';

export const serverToS3 = async (options: ServerToS3Options): Promise<void> => {
  const filenames = await listFromSftpServer(options);
  const localDir = localStorageLocation();
  const keyPrefix = moment().tz(options.timezone).format(options.keyPrefixPattern);

  for (const filename of filenames) {
    const isGzipped = path.extname(filename).toLowerCase() === '.gz';
    const remotePath = path.join(options.location, filename);
    const filepath = path.join(localDir, filename);
    const downloadResponse = await downloadFromSftpServer(options, remotePath, filepath);
    console.log(downloadResponse);

    if (options.decrypt) {
      const fileContent = fs.readFileSync(filepath);
      const encryptedContent: Buffer = isGzipped ? zlib.gunzipSync(fileContent) : fileContent;
      const clearContent: string = await decrypt(encryptedContent.toString(), options.gpgPrivateKey, options.gpgPassphrase);
      const contentToWrite: Buffer = isGzipped ? zlib.gzipSync(Buffer.from(clearContent)) : Buffer.from(clearContent);
      fs.writeFileSync(filepath, contentToWrite);
    }

    let uploadName = filename;
    if (isGzipped && options.gunzip) {
      uploadName = path.parse(filename).name;
      await uncompress(path.join(localDir, filename), path.join(localDir, uploadName));
      fs.unlinkSync(path.join(localDir, filename));
    }

    await uploadToS3(path.join(localDir, uploadName), options.bucket, `${keyPrefix}${uploadName}`);
    console.log(`s3://${options.bucket}/${keyPrefix}${uploadName} has been uploaded.`);
    fs.unlinkSync(path.join(localDir, uploadName));

    if (options.rm) {
      await removeFromSftpServer(options, filename);
      console.log(`${filename} has been deleted from the server.`);
    }
  }
};
