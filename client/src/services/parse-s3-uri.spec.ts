import { parseS3Uri } from './parse-s3-uri';

describe('parseS3Uri', () => {
  test('returns bucket name and key', () => {
    expect(parseS3Uri('s3://kmart-ep-test/keys/ssh/id_kmarepdltst.pub')).toEqual(expect.objectContaining({
      bucket: 'kmart-ep-test',
      key: 'keys/ssh/id_kmarepdltst.pub',
    }));
  });

  test('fails to parse random string', () => {
    expect(() => parseS3Uri('random')).toThrow();
  });
});
