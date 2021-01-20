import { S3 } from 'aws-sdk';
import { parseS3Uri } from './parse-s3-uri';

export const getS3ObjectContent = async (uri: string): Promise<string> => {
  const {bucket, key} = parseS3Uri(uri);
  console.log(bucket,key);

  const s3 = new S3({apiVersion: '2006-03-01'});
  const data = await s3.getObject({
    Bucket: bucket,
    Key: key,
  }).promise();

  return (data.Body as Buffer).toString('utf-8');
};
