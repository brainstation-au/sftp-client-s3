import * as path from 'path';
import Client from 'ssh2-sftp-client';
import { ServerParams } from '../types/server-params';
import { remoteFilename } from './remote-filename';
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
  const remotePath = path.join(location, remoteFilename(localPath, filename));

  return execute({host, port, username, privateKey}, async (client: Client): Promise<string> => {
    return client.fastPut(localPath, remotePath);
  });
};
