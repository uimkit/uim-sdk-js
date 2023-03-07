import { v4 as uuidv4 } from 'uuid';
import { last } from 'lodash';
import invariant from 'invariant';
import { Configuration, StorageApi, Provider, FetchAPI } from '@xopenapi/xapis-js';
import { SupportedFetch } from '../../fetch-types';
import {
  ImageMessagePayload,
  AudioMessagePayload,
  VideoMessagePayload,
  MessagePayload,
  MessageType,
  ImageMomentContent,
  VideoMomentContent,
  MomentContent,
  MomentType,
} from '../../models';
import { UploadOptions, UploadPlugin } from './types';

const TOKEN_KEY = 'uim-js:upload:token:';
const TOKEN_EXPIRY_KEY = 'uim-js:upload:token_expiry:';

interface ImageInfo {
  format: string;
  height: number;
  size: number;
  width: number;
}

interface AudioInfo {
  duration: number;
  format: string;
  size: number;
}

interface VideoInfo {
  duration: number;
  format: string;
  height: number;
  size: number;
  width: number;
}

interface QCloudImageInfo {
  height: string;
  size: string;
  width: string;
  format?: string;
}

/**
 * 默认的上传插件，支持web
 */
export class BaseUploadPlugin implements UploadPlugin {
  _uuid: string;
  _token: string;
  _tokenBasePath: string;
  _fetch?: SupportedFetch;
  _client?: StorageApi;

  constructor(uuid: string, token: string, tokenBasePath: string) {
    this._uuid = uuid;
    this._token = token;
    this._tokenBasePath = tokenBasePath;
  }

  async upload(file: File | string, options: UploadOptions): Promise<MessagePayload | MomentContent> {
    const { message, moment } = options;
    invariant(message || moment, 'must have message or moment');

    // 随机生成上传后的文件名
    const filename = typeof file === 'string' ? file : file.name;
    const ext = last(filename.split('.'));
    const path = `${uuidv4()}.${ext}`;

    const url = await this.uploadFile(file, path, options.onProgress);

    if (message) {
      // 上传消息的文件
      switch (message.type) {
        case MessageType.Image: {
          const imageInfo = await this.getImageInfo(url);
          const thumbnail = await this.getImageThumbnail(url, 400, 400);
          return { url, ...imageInfo, thumbnail } as ImageMessagePayload;
        }
        case MessageType.Audio: {
          const audioInfo = await this.getAudioInfo(path);
          return { url, ...audioInfo } as AudioMessagePayload;
        }
        case MessageType.Video: {
          const videoInfo = await this.getVideoInfo(path);
          const snapshot = await this.getVideoSnapshot(path);
          return { url, ...videoInfo, snapshot } as VideoMessagePayload;
        }
        default: {
          throw new Error('unsupported message type');
        }
      }
    }

    if (moment) {
      switch (moment.type) {
        case MomentType.Image: {
          const imageInfo = await this.getImageInfo(url);
          const thumbnail = await this.getImageThumbnail(url, 400, 400);
          return { url, ...imageInfo, thumbnail } as ImageMomentContent;
        }
        case MomentType.Video: {
          const videoInfo = await this.getVideoInfo(path);
          const snapshot = await this.getVideoSnapshot(path);
          return { url, ...videoInfo, snapshot } as VideoMomentContent;
        }
        default: {
          throw new Error('unsupported moment type');
        }
      }
    }

    throw new Error('unsupported message type');
  }

  async getVideoInfo(path: string): Promise<VideoInfo> {
    const client = await this.getClient();
    const result = await client.getVideoInfo({
      path,
      provider: Provider.Qcloud,
    });
    return {
      width: result.width,
      height: result.height,
      size: result.size,
      duration: result.duration,
      format: last(path.split('.'))!,
    };
  }

  async getVideoSnapshot(path: string): Promise<string> {
    const client = await this.getClient();
    const result = await client.getVideoSnapshot({
      path,
      provider: Provider.Qcloud,
    });
    return result.url;
  }

  async getAudioInfo(path: string): Promise<AudioInfo> {
    const client = await this.getClient();
    const result = await client.getAudioInfo({
      path,
      provider: Provider.Qcloud,
    });
    return {
      size: result.size,
      duration: result.duration,
      format: last(path.split('.'))!,
    };
  }

  async getImageInfo(url: string): Promise<ImageInfo> {
    const result = await this.httpGet<QCloudImageInfo>(`${url}?imageInfo`);
    return {
      width: parseInt(result.width, 10),
      height: parseInt(result.height, 10),
      size: parseInt(result.size, 10),
      format: result.format ?? '',
    };
  }

  async getImageThumbnail(url: string, maxWidth: number, maxHeight: number): Promise<string> {
    return `${url}?imageMogr2/thumbnail/${maxWidth}x${maxHeight}>`;
  }

  async uploadFile(file: File | string, path: string, onProgress?: (percent: number) => void): Promise<string> {
    throw new Error('not implemented');
  }

  async getClient(): Promise<StorageApi> {
    const tokenKey = TOKEN_KEY + this._uuid;
    const tokenExpiryKey = TOKEN_EXPIRY_KEY + this._uuid;

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
      localStorage.setItem(tokenKey, token);
      localStorage.setItem(tokenExpiryKey, expiry.toISOString());
      this._client = undefined;
    }

    if (!this._client) {
      this._client = new StorageApi(
        new Configuration({
          accessToken: token!,
          fetchApi: this._fetch as FetchAPI,
        }),
      );
    }
    return this._client!;
  }

  async httpGet<T>(url: string, token?: string): Promise<T> {
    invariant(this._fetch, 'must setup fetch instance');
    const headers: HeadersInit = { 'content-type': 'application/json' };
    if (token) {
      headers['authorization'] = `Bearer ${token}`;
    }
    const resp = await this._fetch(url, {
      method: 'get',
      headers,
    });
    const respText = await resp.text();
    if (resp.ok) {
      return JSON.parse(respText) as T;
    } else {
      throw new Error(respText);
    }
  }
}
