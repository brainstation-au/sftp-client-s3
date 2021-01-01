import { ServerToS3Options } from '../types/server-to-s3-options';

export const serverToS3 = async (options: ServerToS3Options): Promise<void> => {
  console.log(options);
};
