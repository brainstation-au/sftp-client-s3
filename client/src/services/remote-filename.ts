import * as path from 'path';

export const remoteFilename = (uploadPath: string, filename?: string): string => {
  if (!filename) {
    return path.basename(uploadPath);
  }

  if (uploadPath.endsWith('.gz') && !filename.endsWith('.gz')) {
    return `${path.basename(filename)}.gz`;
  }

  if (!uploadPath.endsWith('.gz') && filename.endsWith('.gz')) {
    return path.parse(filename).name;
  }

  return path.basename(filename);
};
