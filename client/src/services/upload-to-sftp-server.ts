import * as path from 'path';
import Client from 'ssh2-sftp-client';
import { ServerParams } from '../types/server-params';
import { execute } from './sftp';

export const uploadToSftpServer = async (options: ServerParams, localPath: string): Promise<string> => {
  const {
    host,
    port,
    username,
    privateKey,
    location,
    filename,
  } = options;
  const remotePath = path.join(location, filename || path.basename(localPath));

  return execute({host, port, username, privateKey}, async (client: Client): Promise<string> => {
    return client.fastPut(localPath, remotePath);
  });
};
