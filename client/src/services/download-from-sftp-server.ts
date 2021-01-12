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
    const files: Array<{remotePath: string; localPath: string}> = await (filename ? client.list(location, filename) : client.list(location))
      .then(l => l.map(f => ({
        remotePath: path.join(location, f.name),
        localPath: path.join(localDir, f.name),
      })));

    for (const file of files) {
      await client.fastGet(file.remotePath, file.localPath);
    }

    return files.map(f => f.localPath);
  });
};
