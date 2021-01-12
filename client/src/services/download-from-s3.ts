import { S3 } from 'aws-sdk';
import * as fs from 'fs';

export const downloadFromS3 = async (bucket: string, key: string, localPath: string): Promise<void> => {
  const s3 = new S3({apiVersion: '2006-03-01'});
  const data = await s3.getObject({
    Bucket: bucket,
    Key: key,
  }).promise();

  if (!data.Body) {
    throw new Error(`Unable to retrieve object from bucket: ${bucket} and key: ${key}`);
  }

  fs.writeFileSync(localPath, data.Body as Buffer);
};
