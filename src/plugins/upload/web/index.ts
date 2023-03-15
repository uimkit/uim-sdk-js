import { BaseUploadPlugin } from '../base';
import { Configuration, StorageApi, FetchAPI } from '@xopenapi/xapis-js';
import COS from 'cos-js-sdk-v5';

const TOKEN_KEY = 'uim-js:upload:token:';
const TOKEN_EXPIRY_KEY = 'uim-js:upload:token_expiry:';

export class UIMUploadPlugin extends BaseUploadPlugin {

  _client?: StorageApi;

  constructor(uuid: string, token: string, tokenBasePath: string) {
    super(uuid, token, tokenBasePath);
    this._fetch = window.fetch.bind(window);
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
      Body: file as File,
      onProgress: (params) => {
        onProgress && onProgress(params.percent);
      },
    });
    return tmpCredentials.url!;
  }

  async getClient(): Promise<StorageApi> {
    const tokenKey = TOKEN_KEY + this._uuid
    const tokenExpiryKey = TOKEN_EXPIRY_KEY + this._uuid
    let token = localStorage.getItem(tokenKey);
    const expiryStr = localStorage.getItem(tokenExpiryKey);
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
      localStorage.setItem(tokenKey, token)
      localStorage.setItem(tokenExpiryKey, expiry.toISOString())
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
