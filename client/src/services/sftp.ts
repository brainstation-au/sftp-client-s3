import { inject, injectable } from 'inversify';
import * as path from 'path';
import Client, { ConnectOptions } from 'ssh2-sftp-client';
import { SERVER_PARAMS } from '../inversify/constants';
import { ServerParams } from '../types/server-params';
import { remoteFilename } from './remote-filename';

export const execute = async <T>(options: Client.ConnectOptions, callback: (c: Client) => Promise<T>): Promise<T> => {
  const sftp = new Client();

  return sftp.connect(options)
    .then(() => callback(sftp)
      .finally(() => sftp.end())
    );
};

@injectable()
export class SftpService {
  protected location: string;
  protected filename?: string;

  public constructor(
    @inject(SERVER_PARAMS) protected params: ServerParams,
  ) {
    const { location, filename } = params;
    this.location = location;
    this.filename = filename;
  }

  public async list (): Promise<string[]> {
    return this.execute(async (client: Client): Promise<string[]> => {
      return (this.filename ? client.list(this.location, this.filename) : client.list(this.location))
        .then(l => l.map(f => f.name));
    });
  }

  public async exists (filename: string): Promise<boolean> {
    return this.execute(async (client: Client): Promise<boolean> => {
      return client.exists(path.join(this.location, filename)).then(res => !!res);
    });
  }

  public async download (filename: string, localDir: string): Promise<string> {
    const remotePath = path.join(this.location, filename);
    const localPath = path.join(localDir, filename);
    return this.execute(async (client: Client): Promise<string> => {
      return client.fastGet(remotePath, localPath);
    });
  }

  public async upload (localpath: string): Promise<string> {
    const remotepath = path.join(this.location, remoteFilename(localpath, this.filename));
    console.log(remotepath);
    return this.execute(async (client: Client): Promise<string> => {
      return client.fastPut(localpath, remotepath);
    });
  }

  public async delete (filename: string): Promise<string> {
    return this.execute(async (client: Client): Promise<string> => {
      return client.delete(path.join(this.location, filename));
    });
  }

  public async execute <T>(callback: (c: Client) => Promise<T>): Promise<T> {
    const {host, port, username, privateKey} = this.params;
    const options: ConnectOptions = {host, port, username, privateKey};
    const sftp = new Client();

    return sftp.connect(options)
      .then(() => callback(sftp)
        .finally(() => sftp.end())
      );
  }
}
