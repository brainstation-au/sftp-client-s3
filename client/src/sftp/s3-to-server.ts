import { S3ToServerOptions } from '../types/s3-to-server-options';

export const s3ToServer = async (options: S3ToServerOptions): Promise<void> => {
  console.log(options);
};
