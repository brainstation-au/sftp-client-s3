import { S3 } from 'aws-sdk';
import * as fs from 'fs';

export const downloadFromS3 = async (bucket: string, key: string, localPath: string): Promise<void> => {
  const s3 = new S3({apiVersion: '2006-03-01'});
  const request = s3.getObject({
    Bucket: bucket,
    Key: key,
  });
  const w = fs.createWriteStream(localPath);

  return new Promise((resolve, reject) => {
    request.createReadStream()
      .pipe(w)
      .on('close', resolve)
      .on('error', reject);
  });
};
