import { S3 } from 'aws-sdk';
import * as fs from 'fs';

export const uploadToS3 = async (localPath: string, bucket: string, key: string): Promise<S3.Types.PutObjectOutput> => {
  const s3 = new S3({apiVersion: '2006-03-01'});
  return s3.putObject({
    Body: fs.readFileSync(localPath),
    Bucket: bucket,
    Key: key,
  }).promise();
};
