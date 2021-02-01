import Client from 'ssh2-sftp-client';
import { ServerParams } from '../types/server-params';
import { execute } from './sftp';

export const listFromSftpServer = async (options: ServerParams): Promise<string[]> => {
  const {
    host,
    port,
    username,
    privateKey,
    location,
    filename,
  } = options;

  return execute({host, port, username, privateKey}, async (client: Client): Promise<string[]> => {
    return (filename ? client.list(location, filename) : client.list(location))
      .then(l => l.map(f => f.name));
  });
};
