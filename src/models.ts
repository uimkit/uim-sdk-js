// cspell:disable-file

// 翻页查询结果
export interface PageList<T> {
  // 数据列表
  data: Array<T>;
  extra: {
    // 查询数量
    limit: number;
    // 查询起始位置
    offset: number;
    // 总数量
    total: number;
  };
}

// 翻页查询请求
export type PageListParameters<T> = T & {
  // 查询数量
  limit?: number;
  // 查询起始位置
  offset?: number;
};

// 游标
export type Cursor = string | number;

// 游标方向
export type CursorDirection = 'after' | 'before';

// 游标查询请求
export type CursorListParameters<T> = T & {
  // 游标
  cursor?: Cursor;
  // 查询方向
  direction?: CursorDirection;
  // 查询数量
  limit?: number;
};

// 游标查询结果
export interface CursorList<T> {
  // 数据列表
  data: Array<T>;
  extra: {
    // 是否有之后的数据
    has_next: boolean;
    // 是否有之前的数据
    has_previous: boolean;
    // 查询数量
    limit: number;
    // 结束游标
    end_cursor?: Cursor;
    // 开始游标
    start_cursor?: Cursor;
  };
}

// 性别
export enum Gender {
  // 女
  Female = 'female',
  // 男
  Male = 'male',
  // 未设置
  Unknown = 'unknown',
}

// 用户资料
export interface UserProfile {
  // 用户ID
  id: string;
  // 地址
  address?: string;
  // 头像URL
  avatar?: string;
  // 生日
  birthday?: Date;
  // 城市
  city?: string;
  // 公司
  company?: string;
  // 国家
  country?: string;
  // 创建时间
  created_at?: Date;
  // 部门
  department?: string;
  // 区
  district?: string;
  // 邮箱
  email?: string;
  // 性别
  gender?: Gender;
  // 语言
  language?: string;
  // 扩展信息
  metadata?: Record<string, unknown>;
  // 手机号
  mobile?: string;
  // 昵称
  nickname?: string;
  // 省份
  province?: string;
  // 二维码URL
  qrcode?: string;
  // 真实姓名
  real_name?: string;
  // 签名
  signature?: string;
  // 座机电话
  tel?: string;
  // 头衔、职位
  title?: string;
  // 最后更新时间
  updated_at?: Date;
  // 账户名
  username?: string;
}

// 在线状态
export enum Precense {
  // 在线
  Active = 'active',
  // 封号
  Banned = 'banned',
  // 停用
  Disabled = 'disabled',
  // 掉线
  Disconnected = 'disconnected',
}

// 账号
export interface Account {
  // 账号ID
  id: string;
  // 平台用户ID，如：抖音ID
  open_id: string;
  // 在线状态
  presence: Precense;
  // 平台，如：douyin
  provider: string;
  // 地址
  address?: string;
  // 头像URL
  avatar?: string;
  // 生日
  birthday?: Date;
  // 城市
  city?: string;
  // 公司
  company?: string;
  // 国家
  country?: string;
  // 创建时间
  created_at?: Date;
  // 用户自定义ID，如：抖音号
  custom_id?: string;
  // 部门
  department?: string;
  // 区
  district?: string;
  // 邮箱
  email?: string;
  // 性别
  gender?: Gender;
  // 语言
  language?: string;
  // 扩展信息
  metadata?: Record<string, unknown>;
  // 手机号
  mobile?: string;
  // 昵称
  nickname?: string;
  // 省份
  province?: string;
  // 二维码URL
  qrcode?: string;
  // 真实姓名
  real_name?: string;
  // 签名
  signature?: string;
  // 座机电话
  tel?: string;
  // 头衔、职位
  title?: string;
  // 账号总的未读数量
  unread?: number;
  // 最后更新时间
  updated_at?: Date;
  // 账户名
  username?: string;
}

// 好友
export interface Contact {
  // 归属账号ID
  account: string;
  // 好友ID
  id: string;
  // 平台用户ID，如：抖音ID
  open_id: string;
  // 平台，如：douyin
  provider: string;
  // 地址
  address?: string;
  // 备注名
  alias?: string;
  // 头像URL
  avatar?: string;
  // 生日
  birthday?: Date;
  // 是否加入黑名单
  blocked?: boolean;
  // 城市
  city?: string;
  // 公司
  company?: string;
  // 国家
  country?: string;
  // 创建时间
  created_at?: Date;
  // 用户自定义ID，如：抖音号
  custom_id?: string;
  // 部门
  department?: string;
  // 区
  district?: string;
  // 邮箱
  email?: string;
  // 性别
  gender?: Gender;
  // 语言
  language?: string;
  // 是否星标
  marked?: boolean;
  // 扩展信息
  metadata?: Record<string, unknown>;
  // 手机号
  mobile?: string;
  // 昵称
  nickname?: string;
  // 省份
  province?: string;
  // 二维码URL
  qrcode?: string;
  // 真实姓名
  real_name?: string;
  // 备注说明
  remark?: string;
  // 签名
  signature?: string;
  // 标签
  tags?: Array<string>;
  // 座机电话
  tel?: string;
  // 头衔、职位
  title?: string;
  // 最后更新时间
  updated_at?: Date;
  // 账户名
  username?: string;
}

// 好友申请状态
export enum FriendApplicationStatus {
  // 已通过
  Accepted = 'accepted',
  // 已过期
  Expired = 'expired',
  // 已拒绝
  Rejected = 'rejected',
  // 待处理
  Unhandled = 'unhandled',
}

// 好友申请
export interface FriendApplication {
  // 归属账号ID
  account: string;
  // 申请ID
  id: string;
  // 平台用户ID，如：抖音ID
  open_id: string;
  // 平台，如：douyin
  provider: string;
  // 状态
  status: FriendApplicationStatus;
  // 头像URL
  avatar?: string;
  // 城市
  city?: string;
  // 公司
  company?: string;
  // 国家
  country?: string;
  // 用户自定义ID，如：抖音号
  custom_id?: string;
  // 部门
  department?: string;
  // 区
  district?: string;
  // 性别
  gender?: Gender;
  // 申请留言
  hello_message?: string;
  // 昵称
  nickname?: string;
  // 省份
  province?: string;
  // 真实姓名
  real_name?: string;
  // 签名
  signature?: string;
  // 申请来源
  source?: string;
  // 头衔、职位
  title?: string;
}

// 会话类型
export enum ConversationType {
  // 群聊
  Group = 'group',
  // 私聊
  Private = 'private',
  // 系统通知
  System = 'system',
}

// 会话
export interface Conversation {
  // 所属账号ID
  account: string;
  // 最后活跃时间
  active_at: Date;
  // 会话ID
  id: string;
  // 是否置顶
  pinned: boolean;
  // 平台
  provider: string;
  // 会话类型
  type: ConversationType;
  // 未读消息数量
  unread: number;
  // 平台会话ID
  conversation_id?: string;
  // 创建时间
  created_at?: Date;
  // 群聊会话的群组资料
  group?: Group;
  // 最后消息
  last_message?: Message;
  // 扩展信息
  metadata?: Record<string, unknown>;
  // 最后更新时间
  updated_at?: Date;
  // 私聊会话的对方用户资料
  user?: UserProfile;
}

// 消息类型
export enum MessageType {
  // 语音消息
  Audio = 'audio',
  // 聊天记录消息
  ChatHistory = 'chat_history',
  // 文件消息
  File = 'file',
  // 图片消息
  Image = 'image',
  // 分享链接消息
  Link = 'link',
  // 直播间消息
  Live = 'live',
  // 地理位置消息
  Location = 'location',
  // 小程序消息
  Miniprogram = 'miniprogram',
  // 音乐消息
  Music = 'music',
  // 笔记消息
  Note = 'note',
  // 公众号名片消息
  OfficialCard = 'official_card',
  // 文本消息
  Text = 'text',
  // 好友名片消息
  UserCard = 'user_card',
  // 视频消息
  Video = 'video',
  // 视频号名片消息
  VideoCard = 'video_card',
  // 视频号动态消息
  VideoFeed = 'video_feed',
}

// 消息发送状态
export enum MessageStatus {
  // 发送失败
  Failed = 'failed',
  // 发送中
  Sending = 'sending',
  // 发送成功
  Succeeded = 'succeeded',
  // 未发送
  Unsent = 'unsent',
}

// 消息发送方向
export enum MessageFlow {
  // 接收消息
  In = 'in',
  // 发出消息
  Out = 'out',
}

export const MESSAGE_MENTIONED_ALL = '@all';

// 消息
export interface Message {
  // 所属账号ID
  account: string;
  // 所属会话ID
  conversation_id: string;
  // 所属会话类型
  conversation_type: ConversationType;
  // 消息的流向
  flow: MessageFlow;
  // 发送人ID
  from: string;
  // 消息ID
  id: string;
  // 平台消息ID
  message_id: string;
  // 平台
  provider: string;
  // 发送时间
  sent_at: Date;
  // 消息编号，在会话内递增
  seq: number;
  // 状态
  status: MessageStatus;
  // 接收人ID/接受群组ID
  to: string;
  // 消息类型
  type: MessageType;
  // 语音消息内容
  audio?: AudioMessagePayload;
  // 发送人头像
  avatar?: string;
  // 创建时间
  created_at?: Date;
  // 图片消息内容
  image?: ImageMessagePayload;
  // 群文本消息@用户ID列表，如果是 @all 则是 MESSAGE_MENTIONED_ALL
  mentioned_users?: Array<string>;
  // 扩展信息
  metadata?: Record<string, unknown>;
  // 发送人昵称
  nickname?: string;
  // 是否撤回
  revoked?: boolean;
  // 文本消息内容
  text?: string;
  // 最后更新时间
  updated_at?: Date;
  // 视频消息内容
  video?: VideoMessagePayload;
}

// 图片消息内容
export interface ImageMessagePayload {
  // 图片地址
  url: string;
  // 格式
  format?: string;
  // 高度（像素）
  height?: number;
  // 文件md5校验
  md5?: string;
  // 大小（字节）
  size?: number;
  // 缩略图地址
  thumbnail?: string;
  // 宽度（像素）
  width?: number;
}

// 语音消息内容
export interface AudioMessagePayload {
  // 语音地址
  url: string;
  // 时长（秒）
  duration?: number;
  // 格式
  format?: string;
  // 文件md5校验
  md5?: string;
  // 大小（字节）
  size?: number;
}

// 视频消息内容
export interface VideoMessagePayload {
  // 视频地址
  url: string;
  // 时长（秒）
  duration?: number;
  // 格式
  format?: string;
  // 高度（像素）
  height?: number;
  // 文件md5校验
  md5?: string;
  // 大小（字节）
  size?: number;
  // 封面图
  snapshot?: string;
  // 宽度（像素）
  width?: number;
}

// 消息内容
export type MessagePayload = string | ImageMessagePayload | AudioMessagePayload | VideoMessagePayload;

// 群组
export interface Group {
  // 所属账号ID
  account: string;
  // 平台群组ID
  group_id: string;
  // 群组ID
  id: string;
  // 平台
  provider: string;
  // 群组备注名
  alias?: string;
  // 群公告
  announcement?: string;
  // 群组头像
  avatar?: string;
  // 创建时间
  created_at?: Date;
  // 简介
  description?: string;
  // 群成员数量
  member_count?: number;
  // 扩展信息
  metadata?: Record<string, unknown>;
  // 群组名称
  name?: string;
  // 群主用户ID
  owner?: string;
  // 群二维码
  qrcode?: string;
  // 备注说明
  remark?: string;
  // 最后更新时间
  updated_at?: Date;
}

// 群成员角色
export enum GroupMemberRole {
  // 管理员
  Admin = 'admin',
  // 普通成员
  Member = 'member',
  // 群主
  Owner = 'owner',
}

// 群成员
export interface GroupMember {
  // 所属群组ID
  group_id: string;
  // 群成员ID
  id: string;
  // 平台群成员ID
  member_id: string;
  // 平台
  provider: string;
  // 角色
  role: GroupMemberRole;
  // 群内昵称
  alias?: string;
  // 头像
  avatar?: string;
  // 创建时间
  created_at?: Date;
  // 性别
  gender?: Gender;
  // 入群时间
  joined_at?: Date;
  // 扩展信息
  metadata?: Record<string, unknown>;
  // 昵称
  nickname?: string;
  // 最后更新时间
  updated_at?: Date;
}

// 入群申请状态
export type GroupApplicationStatus = FriendApplicationStatus;

// 入群申请
export interface GroupApplication {
  // 所属账号ID
  account: string;
  // 群组ID
  group_id: string;
  // 申请ID
  id: string;
  // 平台用户ID，如：抖音ID
  open_id: string;
  // 平台，如：douyin
  provider: string;
  // 状态
  status: GroupApplicationStatus;
  // 头像URL
  avatar?: string;
  // 城市
  city?: string;
  // 公司
  company?: string;
  // 国家
  country?: string;
  // 用户自定义ID，如：抖音号
  custom_id?: string;
  // 部门
  department?: string;
  // 区
  district?: string;
  // 性别
  gender?: Gender;
  // 申请留言
  hello_message?: string;
  // 昵称
  nickname?: string;
  // 省份
  province?: string;
  // 真实姓名
  real_name?: string;
  // 签名
  signature?: string;
  // 申请来源
  source?: string;
  // 头衔、职位
  title?: string;
}

// 入群邀请状态
export type GroupInvitationStatus = FriendApplicationStatus;

// 入群邀请
export interface GroupInvitation {
  // 所属账号ID
  account: string;
  // 群组ID
  group_id: string;
  // 邀请ID
  id: string;
  // 平台，如：douyin
  provider: string;
  // 状态
  status: GroupInvitationStatus;
  // 群组头像
  group_avatar?: string;
  // 群组名称
  group_name?: string;
  // 邀请留言
  hello_message?: string;
  // 邀请人头像URL
  inviter_avatar?: string;
  // 邀请人昵称
  inviter_name?: string;
  // 邀请来源
  source?: string;
}

export enum MomentType {
  // 图片动态
  Image = 'image',
  // 文字动态
  Text = 'text',
  // 视频动态
  Video = 'video',
}

// 用户动态
export interface Moment {
  // 动态ID
  id: string;
  // 平台动态ID
  moment_id: string;
  // 平台
  provider: string;
  // 发布时间
  published_at: Date;
  // 动态类型
  type: MomentType;
  // 发布用户ID
  user_id: string;
  // 评论数
  comment_count?: number;
  // 评论列表
  comments?: CursorList<Comment>;
  // 创建时间
  created_at?: Date;
  // 图片
  images?: Array<ImageMomentContent>;
  // 点赞数
  like_count?: number;
  // 点赞列表
  likes?: CursorList<Like>;
  // 扩展信息
  metadata?: Record<string, unknown>;
  // 文案
  text?: string;
  // 最后更新时间
  updated_at?: Date;
  // 视频
  video?: VideoMomentContent;
}

// 图片动态内容
export interface ImageMomentContent {
  // 图片地址
  url: string;
  // 格式
  format?: string;
  // 高度（像素）
  height?: number;
  // 文件md5校验
  md5?: string;
  // 大小（字节）
  size?: number;
  // 缩略图地址
  thumbnail?: string;
  // 宽度（像素）
  width?: number;
}

// 视频动态内容
export interface VideoMomentContent {
  // 视频地址
  url: string;
  // 时长（秒）
  duration?: number;
  // 格式
  format?: string;
  // 高度（像素）
  height?: number;
  // 文件md5校验
  md5?: string;
  // 大小（字节）
  size?: number;
  // 封面图
  snapshot?: string;
  // 宽度（像素）
  width?: number;
}

// 动态内容类型
export type MomentContent = ImageMomentContent | VideoMomentContent;

// 评论
export interface Comment {
  // 评论ID
  id: string;
  // 发表评论用户ID
  user_id: string;
  // 发表评论用户头像
  avatar?: string;
  // 评论时间
  commented_at?: Date;
  // 发表评论用户名称
  name?: string;
  // 回复列表
  replies?: CursorList<Comment>;
  // 回复的评论
  reply_to?: Comment;
  // 评论文案
  text?: string;
}

// 点赞
export interface Like {
  // 点赞ID
  id: string;
  // 点赞用户ID
  user_id: string;
  // 点赞用户头像
  avatar?: string;
  // 点赞用户名称
  name?: string;
}
