import * as path from 'path';
import Client from 'ssh2-sftp-client';
import { ServerParams } from '../types/server-params';
import { execute } from './sftp';

export const existsInSftpServer = async (options: ServerParams, filename: string): Promise<boolean> => {
  const {
    host,
    port,
    username,
    privateKey,
    location,
  } = options;

  return execute({host, port, username, privateKey}, async (client: Client): Promise<boolean> => {
    return client.exists(path.join(location, filename)).then(res => !!res);
  });
};