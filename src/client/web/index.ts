import { createQueryParams, createRandomString, popup } from '../../helpers';
import { BaseUIMClient } from '../base';
import { UIMUploadPlugin } from '../../plugins/upload/web';
import { UIMClientOptions } from '../types';

/**
 * 账号授权结果
 */
interface AuthorizeResult {
  // 错误信息
  error?: string;
  // 账号ID
  id?: string;
  // 回传的自定义参数
  state?: string;
}

export class UIMClient extends BaseUIMClient {
  public constructor(token: string, options?: UIMClientOptions) {
    super(token, options);
    this._fetch = window.fetch.bind(window);
    // 默认的插件
    this._plugins = {
      upload: new UIMUploadPlugin(this._uuid, token, this._prefixUrl),
    };
  }

  /**
   * 开始授权账号流程
   *
   * @param provider
   * @param cb
   * @returns
   */
  public async authorize(provider: string, cb?: (id?: string) => void): Promise<string | undefined> {
    const state = createRandomString(16);
    const token = this._auth ?? '';
    const params = { provider, token, state };
    const url = `${this._prefixUrl}authorize?${createQueryParams(params)}`;
    const win = popup(url, 'uim-authorize-window');
    if (!win) {
      throw new Error('open authorize window error');
    }

    const res = await Promise.race([
      // 等待授权页面返回
      this.listenToAuthorizeResult(),
      // 检测授权页面关闭
      new Promise<null>((resolve) => {
        const handle = setInterval(() => {
          if (win.closed) {
            clearInterval(handle);
            // 授权页 postMessage 后会关闭自己，这里延后让 message 先得到处理
            setTimeout(() => resolve(null), 500);
          }
        }, 500);
      }),
    ]);
    if (this._messageEventListener) {
      window.removeEventListener('message', this._messageEventListener);
    }
    this._messageEventListener = undefined;

    if (!res) {
      // 授权页窗口被用户关闭了
      cb && cb();
      return;
    }

    if (res.error) {
      throw new Error(res.error);
    }

    if (res.state !== state) {
      throw new Error('invalid authorize state');
    }

    cb && cb(res.id!);
    return res.id!;
  }

  /**
   * 监听账号授权结果
   *
   * @returns
   */
  private async listenToAuthorizeResult(): Promise<AuthorizeResult> {
    const { origin } = new URL(this._prefixUrl);
    return new Promise<AuthorizeResult>((resolve) => {
      const msgEventListener = (msgEvent: MessageEvent) => {
        if (msgEvent.origin !== origin || msgEvent.data?.type !== 'authorization_response') {
          return;
        }
        window.removeEventListener('message', msgEventListener);
        this._messageEventListener = undefined;
        return resolve(msgEvent.data);
      };

      this._messageEventListener = msgEventListener;
      window.addEventListener('message', msgEventListener);
    });
  }
}
