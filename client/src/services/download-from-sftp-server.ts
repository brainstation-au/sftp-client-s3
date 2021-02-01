import Client from 'ssh2-sftp-client';
import { ServerParams } from '../types/server-params';
import { execute } from './sftp';

export const downloadFromSftpServer = async (options: ServerParams, remotePath: string, localPath: string): Promise<string> => {
  return execute(options, async (client: Client): Promise<string> => {
    return client.fastGet(remotePath, localPath);
  });
};
