import Client from 'ssh2-sftp-client';
import { ServerParams } from '../types/server-params';
import { execute } from './sftp';

export const existsInSftpServer = async (options: ServerParams, remotePath: string): Promise<boolean> => {
  const {
    host,
    port,
    username,
    privateKey,
  } = options;

  return execute({host, port, username, privateKey}, async (client: Client): Promise<boolean> => {
    return client.exists(remotePath).then(res => !!res);
  });
};
