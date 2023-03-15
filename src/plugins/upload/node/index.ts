import nodeFetch from 'node-fetch';
import { BaseUploadPlugin } from '../base';
import COS from 'cos-nodejs-sdk-v5';
import { Configuration, StorageApi, FetchAPI } from '@xopenapi/xapis-js';

export class UIMUploadPlugin extends BaseUploadPlugin {
  _client?: StorageApi;
  _clientToken?: string;
  _clientTokenExpiry?: string;

  constructor(uuid: string, token: string, tokenBasePath: string) {
    super(uuid, token, tokenBasePath);
    this._fetch = nodeFetch;
  }

  async uploadFile(file: any, path: string, onProgress?: (percent: number) => void): Promise<string> {
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
    await cos.sliceUploadFile({
      Bucket: tmpCredentials.bucket,
      Region: tmpCredentials.region,
      Key: path,
      FilePath: file as string,
      onProgress: (params) => {
        onProgress && onProgress(params.percent);
      },
    });

    return tmpCredentials.url!;
  }

  async getClient(): Promise<StorageApi> {
    let token = this._clientToken;
    const expiryStr = this._clientTokenExpiry;
    let expiry = expiryStr ? new Date(expiryStr) : new Date();
    const needRefresh = !token || expiry <= new Date();

    if (needRefresh) {
      // 需要刷新 accessToken
      const result = await this.httpGet<{
        access_token: string;
        expiry: string;
      }>(this._tokenBasePath + 'xapis_token', this._token);
      token = result.access_token;
      expiry = new Date(result.expiry);
      this._clientToken = token;
      this._clientTokenExpiry = expiry.toISOString();
      this._client = undefined;
    }

    if (!this._client) {
      this._client = new StorageApi(
        new Configuration({
          accessToken: `Bearer ${token}`,
          fetchApi: this._fetch as FetchAPI,
        }),
      );
    }
    return this._client!;
  }
}
