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
   * @param {File|string} file 上传的文件句柄或路径
   * @param {UploadOptions} options 上传参数
   */
  upload(file: File | string, options: UploadOptions): Promise<MessagePayload | MomentContent>;
}
