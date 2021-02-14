import * as fs from 'fs';
import * as path from 'path';
import { container } from '../inversify/config';
import { ServerToS3Options } from '../types/server-to-s3-options';
import { uncompress } from './gzip';
import { localStorageLocation } from './local-storage-location';
import { SftpService } from './sftp';
import { uploadToS3 } from './upload-to-s3';

export const serverToS3 = async ({bucket, keyPrefix, gunzip, rm}: ServerToS3Options): Promise<void> => {
  const sftp = container.get<SftpService>(SftpService);
  const filenames = await sftp.list();
  const localDir = localStorageLocation();

  for (const filename of filenames) {
    const downloadResponse = await sftp.download(filename, localDir);
    console.log(downloadResponse);

    let uploadName = filename;
    if (gunzip && path.extname(filename).toLowerCase() === '.gz') {
      uploadName = path.parse(filename).name;
      await uncompress(path.join(localDir, filename), path.join(localDir, uploadName));
      fs.unlinkSync(path.join(localDir, filename));
    }

    await uploadToS3(path.join(localDir, uploadName), bucket, `${keyPrefix}${uploadName}`);
    console.log(`s3://${bucket}/${keyPrefix}${uploadName} has been uploaded.`);
    fs.unlinkSync(path.join(localDir, uploadName));

    if (rm) {
      await sftp.delete(filename);
      console.log(`${filename} has been deleted from the server.`);
    }
  }
};
