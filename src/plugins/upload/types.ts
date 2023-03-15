import { Message, MessagePayload, Moment, MomentContent } from '../../models';

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
