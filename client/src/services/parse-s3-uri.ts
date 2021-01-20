export const parseS3Uri = (uri: string): {bucket: string; key: string} => {
  const [, bucket, key] = (/^s3:\/\/([\w\-_]+)\/(.+)$/g).exec(uri) || Array(3).fill(null);

  if (!bucket || !key) {
    throw Error(`Unable to retrieve bucket and key for ${uri}`);
  }

  return {bucket, key};
};
