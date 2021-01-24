import { ServerToS3Options } from './server-to-s3-options';

describe('ServerToS3Options', () => {
  const options = {
    host: 'sftphost',
    port: 22,
    username: 'sftp_user',
    privateKey: 'private-key',
    location: '/download',
    filename: '_foo.txt',
    bucket: 'my-bucket',
    keyPrefixPattern: '[my-project/foo/bar/year=]YYYY/',
    decrypt: false,
  };

  test('options with valid timezone', () => {
    expect(ServerToS3Options.check({...options, timezone: 'Australia/Melbourne'})).toEqual(expect.objectContaining({
      ...options,
      timezone: 'Australia/Melbourne',
    }));
  });

  test('options with invalid timezone', () => {
    expect(() => ServerToS3Options.check({...options, timezone: 'unknown'})).toThrow();
  });
});
