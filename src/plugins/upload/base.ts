import { nanoid } from 'nanoid';
import { last } from 'lodash';
import invariant from 'invariant';
import { StorageApi, Provider } from '@xopenapi/xapis-js';
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


/**
 * 默认的上传插件，支持web
 */
export class BaseUploadPlugin implements UploadPlugin {

  _uuid: string;
  _token: string;
  _tokenBasePath: string;
  _fetch?: SupportedFetch;

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
          return await this.uploadImage(file, options)
        }
        case MessageType.Video: {
          return await this.uploadVideo(file, options)
        }
        case MessageType.Audio: {
          return await this.uploadAudio(file, options)
        }
        default: {
          throw new Error('unsupported message type');
        }
      }
    }

    if (moment) {
      switch (moment.type) {
        case MomentType.Image: {
          return await this.uploadImage(file, options)
        }
        case MomentType.Video: {
          return await this.uploadVideo(file, options)
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
    const ext = last(filename.split('.'));
    const path = `${nanoid()}.${ext}`;

    const url = await this.uploadFile(file, path, options.onProgress);
    const { width, height, size, format } = await this.getImageInfo(url);
    const large = this.getImageThumbnail(url, width, height, 720)
    const thumnail = this.getImageThumbnail(url, width, height, 198)

    return {
      format, size,
      infos: [
        { url, width, height },
        large, thumnail
      ]
    }
  }

  async uploadVideo(file: any, options: UploadOptions): Promise<VideoMessagePayload | VideoMomentContent> {
    const filename = typeof file === 'string' ? file : file.name;
    const ext = last(filename.split('.'));
    const path = `${nanoid()}.${ext}`;
    const url = await this.uploadFile(file, path, options.onProgress);
    const videoInfo = await this.getVideoInfo(path);
    const snapshot = await this.getVideoSnapshot(path);
    return { url, ...videoInfo, snapshot };
  }

  async uploadAudio(file: any, options: UploadOptions): Promise<AudioMessagePayload> {
    const filename = typeof file === 'string' ? file : file.name;
    const ext = last(filename.split('.'));
    const path = `${nanoid()}.${ext}`;
    const url = await this.uploadFile(file, path, options.onProgress);
    const audioInfo = await this.getAudioInfo(path);
    return { url, ...audioInfo };
  }

  getImageThumbnail(url: string, width: number, height: number, thumbSize: number): ThumbnailInfo {
    const min = width <= height ? width : height
    if (min <= thumbSize) {
      // 最小边小于缩略图尺寸，直接使用原图
      return { url, width, height }
    } else if (height <= width) {
      // 最小边是高，按高等比缩放
      return {
        url: this.getThumbnailUrl(url, thumbSize),
        width: Math.ceil(width * thumbSize / height),
        height: thumbSize
      }
    } else {
      // 最小边是宽，按宽缩放
      return {
        url: this.getThumbnailUrl(url, thumbSize),
        width: thumbSize,
        height: Math.ceil(height * thumbSize / width)
      }
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

  getThumbnailUrl(url: string, size: number): string {
    return `${url}?imageView2/3/w/${size}/h/${size}`;
  }

  async uploadFile(file: any, path: string, onProgress?: (percent: number) => void): Promise<string> {
    throw new Error('not implemented');
  }

  async getClient(): Promise<StorageApi> {
    throw new Error('not implemented');
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

interface ThumbnailInfo {
  url: string
  width: number
  height: number
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
