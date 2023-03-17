import nodeFetch from 'node-fetch';
import invariant from 'invariant';
import { last, omit, pick } from 'lodash';
import { nanoid } from 'nanoid';
import { BaseUIMClient, setCreatedMessageData } from '../base';
import { UIMClientOptions } from '../types';
import {
  MessageType,
  Message,
  ImageMessagePayload,
  AudioMessagePayload,
  VideoMessagePayload,
  Moment,
  MomentType,
  ImageMomentContent,
  VideoMomentContent,
} from '../../models';
import { UploadOptions } from '../../plugins';
import { UIMUploadPlugin } from '../../plugins/upload/node';
import {
  SendMessageParameters,
  CreateMessageParameters,
  PublishMomentParameters,
  CreateMomentParameters,
} from '../../api/node';
import { statSync } from 'fs';

export class UIMClient extends BaseUIMClient {
  public constructor(token: string, options?: UIMClientOptions) {
    super(token, options);
    this._fetch = nodeFetch;
    // 默认的插件
    this._plugins = {
      upload: new UIMUploadPlugin(this._uuid, token, this._prefixUrl),
    };
  }

  /**
   * 发送消息
   *
   * @param parameters
   * @returns
   */
  public async sendMessage(parameters: SendMessageParameters): Promise<Message> {
    // 先上传文件
    if (parameters.file) {
      const plugin = this.getPlugin('upload');
      invariant(plugin, 'must have upload plugin');

      const options: UploadOptions = {
        onProgress: parameters.on_progress,
        message: parameters as Message,
      };
      const payload = await plugin.upload(parameters.file, options);

      switch (parameters.type) {
        case MessageType.Image: {
          parameters.image = payload as ImageMessagePayload;
          break;
        }
        case MessageType.Audio: {
          parameters.audio = payload as AudioMessagePayload;
          break;
        }
        case MessageType.Video: {
          parameters.video = payload as VideoMessagePayload;
          break;
        }
        default: {
          throw new Error('unsupported message type');
        }
      }
    }

    return this.request<Message>({
      path: 'send_message',
      method: 'post',
      body: omit(parameters, ['file', 'on_progress']),
    });
  }

  /**
   * 创建文本消息
   *
   * @param parameters
   * @returns
   */
  public createTextMessage(parameters: CreateMessageParameters): SendMessageParameters {
    invariant(parameters.text, 'must have text payload');
    const message = pick(parameters, ['from', 'to', 'conversation_id', 'text', 'mentioned_users']) as Partial<Message>;
    setCreatedMessageData(message);
    return { type: MessageType.Text, ...message };
  }

  /**
   * 创建图片消息
   *
   * @param parameters
   * @returns
   */
  public createImageMessage(parameters: CreateMessageParameters): SendMessageParameters {
    invariant(parameters.image || parameters.file, 'must have image payload or file');
    const message = pick(parameters, ['from', 'to', 'conversation_id', 'image']) as Partial<Message>;
    setCreatedMessageData(message);

    // 直接传入已经构造好的 image 参数
    if (message.image) {
      return { type: MessageType.Image, ...message };
    }

    // 需要上传文件
    const { file, on_progress } = parameters;
    // 先构造图片信息，用于发送前占位
    const url = file!;
    // 检查图片大小
    const { size } = statSync(url);
    if (size > 20971520) {
      throw new Error('图片大小超过限制');
    }
    // 图片格式
    const format = last(url.split('.'));
    // 图片信息，包含原图、中图、小图
    message.image = { size, format, infos: [] };
    for (let i = 0; i < 3; i++) {
      message.image.infos.push({ url, width: 0, height: 0 });
    }
    return { type: MessageType.Image, ...message, file, on_progress };
  }

  /**
   * 创建音频消息
   *
   * @param parameters
   * @returns
   */
  public createAudioMessage(parameters: CreateMessageParameters): SendMessageParameters {
    invariant(parameters.audio || parameters.file, 'must have audio payload or file');
    const message = pick(parameters, ['from', 'to', 'conversation_id', 'audio']) as Partial<Message>;
    setCreatedMessageData(message);

    // 直接传入已经构造好的 audio 参数
    if (message.audio) {
      return { type: MessageType.Audio, ...message };
    }

    // 需要上传文件，拿到文件句柄
    const { file, on_progress } = parameters;
    invariant(file, 'must select files');
    const url = file;
    const { size } = statSync(url);
    if (size > 20971520) {
      throw new Error('音频大小超过限制');
    }
    const duration = 0;
    const format = last(file.split('.'));
    message.audio = { url, duration, size, format };
    return { type: MessageType.Audio, ...message, file, on_progress };
  }

  /**
   * 创建视频消息
   * @param parameters
   * @returns
   */
  public createVideoMessage(parameters: CreateMessageParameters): SendMessageParameters {
    invariant(parameters.video || parameters.file, 'must have video payload or file');
    const message = pick(parameters, ['from', 'to', 'conversation_id', 'video']) as Partial<Message>;
    setCreatedMessageData(message);

    // 直接传入已经构造好的 video 参数
    if (message.video) {
      return { type: MessageType.Video, ...message };
    }

    // 需要上传文件，拿到文件句柄
    const { file, on_progress } = parameters;
    invariant(file, 'must select files');
    const url = file;
    const { size } = statSync(url);
    if (size > 104857600) {
      throw new Error('视频大小超过限制');
    }
    const duration = 0;
    const format = last(file.split('.'));
    message.video = { url, duration, size, format };
    return { type: MessageType.Video, ...message, file, on_progress };
  }

  /**
   * 发布动态
   *
   * @param parameters
   * @returns
   */
  public async publishMoment(parameters: PublishMomentParameters): Promise<Moment> {
    // 先上传文件
    if (parameters.files && parameters.files.length > 0) {
      const plugin = this.getPlugin('upload');
      invariant(plugin, 'must have upload plugin');

      const contents = await Promise.all(
        parameters.files.map((f, idx) => {
          const options: UploadOptions = {
            onProgress: (percent) => parameters.on_progress && parameters.on_progress(idx, percent),
            moment: parameters as Moment,
          };
          return plugin.upload(f, options);
        }),
      );

      switch (parameters.type) {
        case MomentType.Image: {
          parameters.images = contents as Array<ImageMomentContent>;
          break;
        }
        case MomentType.Video: {
          parameters.video = contents[0] as VideoMomentContent;
          break;
        }
        default: {
          throw new Error('unsupported message type');
        }
      }
    }

    return this.request<Moment>({
      path: 'publish_moment',
      method: 'post',
      body: omit(parameters, ['files', 'on_progress']),
    });
  }

  /**
   * 创建文本动态
   *
   * @param parameters
   * @returns
   */
  public createTextMoment(parameters: CreateMomentParameters): PublishMomentParameters {
    invariant(parameters.text, 'must have text');
    const moment = pick(parameters, ['user_id', 'text']) as Partial<Moment>;
    // 由前端生成id
    moment.id = nanoid();
    return { type: MomentType.Text, ...moment };
  }

  /**
   * 创建图片动态
   *
   * @param parameters
   * @returns
   */
  public createImagesMoment(parameters: CreateMomentParameters): PublishMomentParameters {
    invariant(parameters.images || parameters.files, 'must have images or files');
    const moment = pick(parameters, ['user_id', 'images']) as Partial<Moment>;

    // 由前端生成id
    moment.id = nanoid();

    // 直接传入已经构造好的 images 参数
    if (moment.images && moment.images.length > 0) {
      return { type: MomentType.Image, ...moment };
    }

    // 需要上传文件，拿到文件句柄
    const { files, on_progress } = parameters;
    invariant(files && files.length > 0, 'must select files');

    // 构造图片信息，方便占位显示
    moment.images = [];
    files.forEach((file) => {
      const url = file;
      // 检查图片大小
      const { size } = statSync(file);
      if (size > 20971520) {
        throw new Error('图片大小超过限制');
      }
      // 图片格式
      const format = last(file.split('.'));
      // 图片信息，包含原图、中图、小图
      const image: ImageMomentContent = { size, format, infos: [] };
      for (let i = 0; i < 3; i++) {
        image.infos.push({ url, width: 0, height: 0 });
      }
      moment.images?.push(image);
    });

    return { type: MomentType.Image, ...moment, files, on_progress };
  }

  /**
   * 创建视频动态
   *
   * @param parameters
   * @returns
   */
  public createVideoMoment(parameters: CreateMomentParameters): PublishMomentParameters {
    invariant(parameters.video || parameters.files, 'must have video or files');
    const moment = pick(parameters, ['user_id', 'video']) as Partial<Moment>;

    // 由前端生成id
    moment.id = nanoid();

    // 直接传入已经构造好的 video 参数
    if (moment.video) {
      return { type: MomentType.Video, ...moment };
    }

    // 需要上传文件，拿到文件句柄
    const file = parameters.files?.at(0);
    invariant(file, 'must select files');
    const { on_progress } = parameters;

    // 构造视频信息，方便占位显示
    const url = file;
    const { size } = statSync(url);
    if (size > 104857600) {
      throw new Error('视频大小超过限制');
    }
    const duration = 0;
    const format = last(url.split('.'));
    moment.video = { url, duration, size, format };

    return { type: MomentType.Video, ...moment, files: [file], on_progress };
  }
}
