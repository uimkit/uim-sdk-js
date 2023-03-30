import { nanoid } from 'nanoid';
import invariant from 'invariant';
import COS from 'cos-js-sdk-v5';
import { Configuration, StorageApi, Provider } from '@xopenapi/xapis-js';
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
  Message,
  Moment
} from '../models';
import { fileExt } from '../helpers';

const TOKEN_KEY = 'uim-js:upload:token:';
const TOKEN_EXPIRY_KEY = 'uim-js:upload:token_expiry:';

/**
 * 上传文件参数
 */
export interface UploadOptions {
  // 为消息上传时指定消息
  message?: Message;
  // 为动态上传时指定动态
  moment?: Moment;
  // 上传进度回调
  onProgress?: (percent: number) => void;
}

/**
 * 上传文件插件接口
 */
export interface UploadPlugin {
  /**
   * 上传文件
   *
   * @param file
   * @param options
   */
  upload(file: any, options: UploadOptions): Promise<MessagePayload | MomentContent>;
}

/**
 * 默认的上传插件
 */
export class UIMUploadPlugin implements UploadPlugin {
  _uuid: string;
  _token: string;
  _tokenBasePath: string;
  _client?: StorageApi;

  constructor(uuid: string, token: string, tokenBasePath: string) {
    this._uuid = uuid;
    this._token = token;
    this._tokenBasePath = tokenBasePath;
  }

  async upload(file: any, options: UploadOptions): Promise<MessagePayload | MomentContent> {
    const { message, moment } = options;
    invariant(message || moment, 'must have message or moment');

    if (message) {
      switch (message.type) {
        case MessageType.Image: {
          return await this.uploadImage(file, options);
        }
        case MessageType.Video: {
          return await this.uploadVideo(file, options);
        }
        case MessageType.Audio: {
          return await this.uploadAudio(file, options);
        }
        default: {
          throw new Error('unsupported message type');
        }
      }
    }

    if (moment) {
      switch (moment.type) {
        case MomentType.Image: {
          return await this.uploadImage(file, options);
        }
        case MomentType.Video: {
          return await this.uploadVideo(file, options);
        }
        default: {
          throw new Error('unsupported moment type');
        }
      }
    }

    throw new Error('must have message or moment');
  }

  async uploadImage(file: any, options: UploadOptions): Promise<ImageMessagePayload | ImageMomentContent> {
    const filename = typeof file === 'string' ? file : file.name;
    const ext = fileExt(filename);
    const path = `${nanoid()}.${ext}`;

    const url = await this.uploadFile(file, path, options.onProgress);
    const { width, height, size, format } = await this.getImageInfo(url);
    const large = this.getImageThumbnail(url, width, height, 720);
    const thumnail = this.getImageThumbnail(url, width, height, 198);

    return {
      format,
      size,
      infos: [{ url, width, height }, large, thumnail],
    };
  }

  async uploadVideo(file: any, options: UploadOptions): Promise<VideoMessagePayload | VideoMomentContent> {
    const filename = typeof file === 'string' ? file : file.name;
    const ext = fileExt(filename);
    const path = `${nanoid()}.${ext}`;
    const url = await this.uploadFile(file, path, options.onProgress);
    const videoInfo = await this.getVideoInfo(path);
    const snapshot = await this.getVideoSnapshot(path);
    return { url, ...videoInfo, snapshot };
  }

  async uploadAudio(file: any, options: UploadOptions): Promise<AudioMessagePayload> {
    const filename = typeof file === 'string' ? file : file.name;
    const ext = fileExt(filename);
    const path = `${nanoid()}.${ext}`;
    const url = await this.uploadFile(file, path, options.onProgress);
    const audioInfo = await this.getAudioInfo(path);
    return { url, ...audioInfo };
  }

  getImageThumbnail(url: string, width: number, height: number, thumbSize: number): ThumbnailInfo {
    const min = width <= height ? width : height;
    if (min <= thumbSize) {
      // 最小边小于缩略图尺寸，直接使用原图
      return { url, width, height };
    } else if (height <= width) {
      // 最小边是高，按高等比缩放
      return {
        url: this.getThumbnailUrl(url, thumbSize),
        width: Math.ceil((width * thumbSize) / height),
        height: thumbSize,
      };
    } else {
      // 最小边是宽，按宽缩放
      return {
        url: this.getThumbnailUrl(url, thumbSize),
        width: thumbSize,
        height: Math.ceil((height * thumbSize) / width),
      };
    }
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
      format: fileExt(path),
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
      format: fileExt(path),
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

  getThumbnailUrl(url: string, size: number): string {
    return `${url}?imageView2/3/w/${size}/h/${size}`;
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
        new Configuration({ accessToken: `Bearer ${token}` }),
      );
    }
    return this._client!;
  }

  async httpGet<T>(url: string, token?: string): Promise<T> {
    const headers: HeadersInit = { 'content-type': 'application/json' };
    if (token) {
      headers['authorization'] = `Bearer ${token}`;
    }
    const resp = await fetch(url, {
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

interface ThumbnailInfo {
  height: number;
  url: string;
  width: number;
}

interface QCloudImageInfo {
  height: string;
  size: string;
  width: string;
  format?: string;
}

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
