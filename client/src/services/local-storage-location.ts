import * as fs from 'fs';

export const localStorageLocation = (): string => {
  const storageLocation = process.env['STORAGE_LOCATION'] || '/tmp/';
  fs.mkdirSync(storageLocation, {recursive: true});
  return fs.mkdtempSync(storageLocation);
};
