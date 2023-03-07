import nodeFetch from 'node-fetch';
import { BaseUIMClient } from '../base';
import { UIMClientOptions } from '../types';
import { UIMUploadPlugin } from '../../plugins/upload/node';

export class UIMClient extends BaseUIMClient {
  public constructor(token: string, options?: UIMClientOptions) {
    super(token, options);
    this._fetch = nodeFetch;
    // 默认的插件
    this._plugins = {
      upload: new UIMUploadPlugin(this._uuid, token, this._prefixUrl),
    };
  }
}
