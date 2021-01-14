import * as fs from 'fs';
import moment from 'moment-timezone';
import * as path from 'path';
import { ServerToS3Options } from '../types/server-to-s3-options';
import { downloadFromSftpServer } from './download-from-sftp-server';
import { localStorageLocation } from './local-storage-location';
import { decrypt } from './openpgp';
import { removeFromSftpServer } from './remove-from-sftp-server';
import { uploadToS3 } from './upload-to-s3';

export const serverToS3 = async (options: ServerToS3Options): Promise<void> => {
  const localDir = localStorageLocation();
  const filenames = await downloadFromSftpServer(options, localDir);

  let uploadDir = localDir;
  if (options.decrypt) {
    uploadDir = localStorageLocation();
    for (const filename of filenames) {
      const encryptedContent = fs.readFileSync(path.join(localDir, filename), 'utf-8');
      const clearContent = await decrypt(encryptedContent, options.gpgPrivateKey, options.passphrase);
      fs.writeFileSync(path.join(uploadDir, filename), clearContent, {encoding: 'utf-8'});
    }
  }

  const {bucket, keyPrefixFormat} = options;
  const keyPrefix = moment().tz('utc').format(keyPrefixFormat);
  for (const filename of filenames) {
    await uploadToS3(path.join(uploadDir, filename), bucket, `${keyPrefix}${filename}`);
    await removeFromSftpServer(options, filename);
  }
};
