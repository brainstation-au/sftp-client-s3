import Client from 'ssh2-sftp-client';

export const execute = async (callback: (c: Client) => Promise<void>): Promise<void> => {
  const sftp = new Client();
  const options: Client.ConnectOptions = {
    host: process.env['SFTP_HOST'],
    port: +(process.env['SFTP_PORT'] || 22),
    username: process.env['SFTP_USER'],
    privateKey: process.env['PRIVATE_KEY'],
  };

  return sftp.connect(options)
    .then(() => callback(sftp)
      .finally(() => sftp.end())
    );
};
