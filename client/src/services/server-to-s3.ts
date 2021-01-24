import * as fs from 'fs';
import moment from 'moment-timezone';
import * as path from 'path';
import * as zlib from 'zlib';
import { ServerToS3Options } from '../types/server-to-s3-options';
import { downloadFromSftpServer } from './download-from-sftp-server';
import { localStorageLocation } from './local-storage-location';
import { decrypt } from './openpgp';
import { removeFromSftpServer } from './remove-from-sftp-server';
import { uploadToS3 } from './upload-to-s3';

export const serverToS3 = async (options: ServerToS3Options): Promise<void> => {
  const localDir = localStorageLocation();
  const filenames = await downloadFromSftpServer(options, localDir);
  const keyPrefix = moment().tz(options.timezone).format(options.keyPrefixPattern);

  for (const filename of filenames) {
    const filepath = path.join(localDir, filename);
    const isGzipped = path.extname(filename).toLowerCase() === '.gz';

    if (options.decrypt) {
      const fileContent = fs.readFileSync(filepath);
      const encryptedContent: Buffer = isGzipped ? zlib.gunzipSync(fileContent) : fileContent;
      const clearContent: string = await decrypt(encryptedContent.toString(), options.gpgPrivateKey, options.passphrase);
      const contentToWrite: Buffer = isGzipped ? zlib.gzipSync(Buffer.from(clearContent)) : Buffer.from(clearContent);
      fs.writeFileSync(filepath, contentToWrite);
    }

    await uploadToS3(filepath, options.bucket, `${keyPrefix}${filename}`);

    if (options.rm) {
      await removeFromSftpServer(options, filename);
    }
  }
};
