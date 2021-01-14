import * as path from 'path';
import Client from 'ssh2-sftp-client';
import { ServerParams } from '../types/server-params';
import { execute } from './sftp';

export const removeFromSftpServer = async (options: ServerParams, filename: string): Promise<string> => {
  const {
    host,
    port,
    username,
    privateKey,
    location,
  } = options;

  return execute({host, port, username, privateKey}, async (client: Client): Promise<string> => {
    return client.delete(path.join(location, filename));
  });
};
