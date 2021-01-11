import * as fs from 'fs';
import * as path from 'path';
import Client from 'ssh2-sftp-client';
import { ServerParams } from '../types/server-params';
import { ServerToS3Options } from '../types/server-to-s3-options';
import { execute } from './sftp';

export const serverToS3 = async (options: ServerToS3Options): Promise<void> => {
  console.log(options);
};

export const downloadFromSftpServer = async (options: ServerParams): Promise<string[]> => {
  const {
    host,
    port,
    username,
    privateKey,
    location,
    filename,
  } = options;
  const storageLocation = process.env['STORAGE_LOCATION'] || '/tmp/download/';
  fs.mkdirSync(storageLocation, {recursive: true});
  const downloadLocation = fs.mkdtempSync(storageLocation);

  return execute({host, port, username, privateKey}, async (client: Client): Promise<string[]> => {
    const files: Array<{remotePath: string; localPath: string}> = await (filename ? client.list(location, filename) : client.list(location))
      .then(l => l.map(f => ({
        remotePath: path.join(location, f.name),
        localPath: path.join(downloadLocation, f.name),
      })));
    for (const file of files) {
      await client.fastGet(file.remotePath, file.localPath);
    }

    return files.map(f => f.localPath);
  });
};

