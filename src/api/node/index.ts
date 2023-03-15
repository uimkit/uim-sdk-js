// cspell:disable-file

import { MessageTargetParameters } from '../base';
import { Message, Moment } from '../../models';

// 发送消息请求
export type SendMessageParameters = Partial<Message> & {
  // 待上传的文件
  file?: string;
  // 文件上传进度回调
  on_progress?: (percent: number) => void;
};

// 创建消息参数
export type CreateMessageParameters = MessageTargetParameters &
  Partial<Pick<Message, 'text' | 'image' | 'audio' | 'video' | 'mentioned_users'>> & {
    // 待上传的文件
    file?: string;
    // 文件上传进度回调
    on_progress?: (percent: number) => void;
  };

// 发布动态参数
export type PublishMomentParameters = Partial<Moment> & {
  // 待上传的文件列表
  files?: Array<string>;
  /**
   * 上传进度回调
   * @param {number} idx 上传的第几个文件
   * @param {number} percent 上传进度，范围 0~100
   * @returns
   */
  on_progress?: (idx: number, percent: number) => void;
};

// 创建动态参数
export type CreateMomentParameters = Pick<Moment, 'user_id' | 'text' | 'images' | 'video'> & {
  // 待上传的文件
  files?: Array<string>;
  /**
   * 上传进度回调
   * @param {number} idx 上传的第几个文件
   * @param {number} percent 上传进度，范围 0~100
   * @returns
   */
  on_progress?: (idx: number, percent: number) => void;
};
