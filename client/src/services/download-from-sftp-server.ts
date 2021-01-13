import * as path from 'path';
import Client from 'ssh2-sftp-client';
import { ServerParams } from '../types/server-params';
import { execute } from './sftp';

export const downloadFromSftpServer = async (options: ServerParams, localDir: string): Promise<string[]> => {
  const {
    host,
    port,
    username,
    privateKey,
    location,
    filename,
  } = options;

  return execute({host, port, username, privateKey}, async (client: Client): Promise<string[]> => {
    const files: string[] = await (filename ? client.list(location, filename) : client.list(location))
      .then(l => l.map(f => f.name));

    for (const file of files) {
      const remotePath = path.join(location, file);
      const localPath = path.join(localDir, file);
      await client.fastGet(remotePath, localPath);
    }

    return files;
  });
};
