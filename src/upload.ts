import axios from 'axios';
import { nanoid } from 'nanoid';
import COS from 'cos-js-sdk-v5';
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
} from './models';
import { fileExt } from './helpers';

const TOKEN_KEY = 'uim-js:upload:token:';
const TOKEN_EXPIRY_KEY = 'uim-js:upload:token_expiry:';
const STORAGE_BASE_URL = 'https://api.growingbox.cn/storage/v1'

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
  upload(file: File, options: UploadOptions): Promise<MessagePayload | MomentContent>;
}

/**
 * 默认的上传插件
 */
export class UIMUploadPlugin implements UploadPlugin {

  private uuid: string
  private baseUrl: string
  private token: string

  constructor(uuid: string, baseUrl: string, token: string) {
    this.uuid = uuid;
    this.baseUrl = baseUrl
    this.token = token
  }

  async upload(file: File, options: UploadOptions): Promise<MessagePayload | MomentContent> {
    const { message, moment } = options;
    if (!message && !moment) {
      throw new Error('must have message or moment')
    }

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

  async uploadImage(file: File, options: UploadOptions): Promise<ImageMessagePayload | ImageMomentContent> {
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

  async uploadVideo(file: File, options: UploadOptions): Promise<VideoMessagePayload | VideoMomentContent> {
    const filename = typeof file === 'string' ? file : file.name;
    const ext = fileExt(filename);
    const path = `${nanoid()}.${ext}`;
    const url = await this.uploadFile(file, path, options.onProgress);
    const videoInfo = await this.getVideoInfo(path);
    const snapshot = await this.getVideoSnapshot(path);
    return { url, ...videoInfo, snapshot };
  }

  async uploadAudio(file: File, options: UploadOptions): Promise<AudioMessagePayload> {
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
    const token = await this.getStorageApiToken()
    const { data } = await axios.get<VideoInfo>(STORAGE_BASE_URL + "/video_info", {
      params: {
        path,
        provider: "qcloud",
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (!data.format) {
      data.format = fileExt(path)
    }
    return data;
  }

  async getVideoSnapshot(path: string): Promise<string> {
    const token = await this.getStorageApiToken()
    const { data } = await axios.get<{ url: string }>(STORAGE_BASE_URL + "/video_snapshot", {
      params: {
        path,
        provider: "qcloud",
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return data.url;
  }

  async getAudioInfo(path: string): Promise<AudioInfo> {
    const token = await this.getStorageApiToken()
    const { data } = await axios.get<AudioInfo>(STORAGE_BASE_URL + "/audio_info", {
      params: {
        path,
        provider: "qcloud",
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (!data.format) {
      data.format = fileExt(path)
    }
    return data
  }

  async getImageInfo(url: string): Promise<ImageInfo> {
    const { data } = await axios.get<QCloudImageInfo>(`${url}?imageInfo`)
    return {
      width: parseInt(data.width, 10),
      height: parseInt(data.height, 10),
      size: parseInt(data.size, 10),
      format: data.format ?? '',
    };
  }

  getThumbnailUrl(url: string, size: number): string {
    return `${url}?imageView2/3/w/${size}/h/${size}`;
  }

  async uploadFile(file: File, path: string, onProgress?: (percent: number) => void): Promise<string> {
    const token = await this.getStorageApiToken()
    const { data } = await axios.get<TemporaryCredentials>(STORAGE_BASE_URL + "/temporary_credentials", {
      params: {
        path
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    const credentials = data.credentials as any;
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
      Bucket: data.bucket,
      Region: data.region,
      Key: path,
      Body: file,
      onProgress: (params) => {
        onProgress && onProgress(params.percent);
      },
    });
    return data.url;
  }


  async getStorageApiToken(): Promise<string | null> {
    const tokenKey = TOKEN_KEY + this.uuid;
    const tokenExpiryKey = TOKEN_EXPIRY_KEY + this.uuid;
    let token = localStorage.getItem(tokenKey);
    const expiryStr = localStorage.getItem(tokenExpiryKey);
    let expiry = expiryStr ? new Date(expiryStr) : new Date();
    const needRefresh = !token || expiry <= new Date();

    if (needRefresh) {
      // 需要刷新 accessToken
      const { data } = await axios.get<{
        access_token: string;
        expiry: string
      }>(`${this.baseUrl}/xapis_token`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      })
      token = data.access_token;
      expiry = new Date(data.expiry);
      localStorage.setItem(tokenKey, token);
      localStorage.setItem(tokenExpiryKey, expiry.toISOString());
    }
    return token
  }
}

interface TemporaryCredentials {
  provider: string;
  bucket: string
  region: string
  cdn?: string
  url: string
  credentials?: any
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
