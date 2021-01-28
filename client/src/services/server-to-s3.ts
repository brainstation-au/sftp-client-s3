import * as fs from 'fs';
import moment from 'moment-timezone';
import * as path from 'path';
import * as zlib from 'zlib';
import { ServerToS3Options } from '../types/server-to-s3-options';
import { downloadFromSftpServer } from './download-from-sftp-server';
import { uncompress } from './gzip';
import { localStorageLocation } from './local-storage-location';
import { decrypt } from './openpgp';
import { removeFromSftpServer } from './remove-from-sftp-server';
import { uploadToS3 } from './upload-to-s3';

export const serverToS3 = async (options: ServerToS3Options): Promise<void> => {
  const localDir = localStorageLocation();
  const filenames = await downloadFromSftpServer(options, localDir);
  console.log(`Files have been downloaded from ${options.host}`, JSON.stringify(filenames));
  const keyPrefix = moment().tz(options.timezone).format(options.keyPrefixPattern);

  for (const filename of filenames) {
    const filepath = path.join(localDir, filename);
    const isGzipped = path.extname(filename).toLowerCase() === '.gz';

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
    }

    await uploadToS3(path.join(localDir, uploadName), options.bucket, `${keyPrefix}${uploadName}`);
    console.log(`s3://${options.bucket}/${keyPrefix}${uploadName} has been uploaded.`);

    if (options.rm) {
      await removeFromSftpServer(options, filename);
      console.log(`${filename} has been deleted from the server.`);
    }
  }
};
