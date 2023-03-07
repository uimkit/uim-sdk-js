import nodeFetch from 'node-fetch';
import { BaseUploadPlugin } from '../base';
import COS from 'cos-nodejs-sdk-v5';

export class UIMUploadPlugin extends BaseUploadPlugin {
  constructor(uuid: string, token: string, tokenBasePath: string) {
    super(uuid, token, tokenBasePath);
    this._fetch = nodeFetch;
  }

  async uploadFile(file: string, path: string, onProgress?: (percent: number) => void): Promise<string> {
    const client = await this.getClient();
    const tmpCredentials = await client.getStorageTemporaryCredentials({ path });
    const credentials = tmpCredentials.credentials as any;

    const cos = new COS({
      getAuthorization(_options, callback) {
        callback({
          TmpSecretId: credentials.tmpSecretId,
          TmpSecretKey: credentials.tmpSecretKey,
          SecurityToken: credentials.sessionToken,
          StartTime: credentials.startTime,
          ExpiredTime: credentials.expiredTime,
        });
      },
    });
    cos.sliceUploadFile({
      Bucket: tmpCredentials.bucket,
      Region: tmpCredentials.region,
      Key: path,
      FilePath: file,
      onProgress: (params) => {
        onProgress && onProgress(params.percent);
      },
    });

    return tmpCredentials.url!;
  }
}
