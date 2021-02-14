import { ServerParams } from '../types/server-params';
import { SftpService } from './sftp';

export const listFn = jest.fn();
export const existsFn = jest.fn();
export const downloadFn = jest.fn();
export const uploadFn = jest.fn();
export const deleteFn = jest.fn();

export class SftpServiceMock extends SftpService {
  constructor() {
    super({} as ServerParams);
  }
  public list = listFn;
  public exists = existsFn;
  public download = downloadFn;
  public upload = uploadFn;
  public delete = deleteFn;
}

export const resetSftpServiceMock = (): void => {
  listFn.mockReset();
  existsFn.mockReset();
  downloadFn.mockReset();
  uploadFn.mockReset();
  deleteFn.mockReset();
};
