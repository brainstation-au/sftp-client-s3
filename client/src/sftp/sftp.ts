import Client from 'ssh2-sftp-client';

export const execute = async <T>(options: Client.ConnectOptions, callback: (c: Client) => Promise<T>): Promise<T> => {
  const sftp = new Client();

  return sftp.connect(options)
    .then(() => callback(sftp)
      .finally(() => sftp.end())
    );
};
