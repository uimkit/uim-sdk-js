// cspell:disable-file

// 翻页查询结果
export interface PageList<T> {
  extra: {
    // 查询起始位置
    offset: number
    // 查询数量
    limit: number
    // 总数量
    total: number
  }
  // 数据列表
  data: Array<T>
}

// 翻页查询请求
export type PageListParameters<T> = T & {
  // 查询起始位置
  offset?: number
  // 查询数量
  limit?: number
}

// 游标
export type Cursor = string | number

// 游标方向
export type CursorDirection = "after" | "before"

// 游标查询请求
export type CursorListParameters<T> = T & {
  // 游标
  cursor?: Cursor
  // 查询方向
  direction?: CursorDirection
  // 查询数量
  limit?: number
}

// 游标查询结果
export interface CursorList<T> {
  extra: {
    // 开始游标
    start_cursor?: Cursor
    // 结束游标
    end_cursor?: Cursor
    // 是否有之前的数据
    has_previous: boolean
    // 是否有之后的数据
    has_next: boolean
    // 查询数量
    limit: number
  }
  // 数据列表
  data: Array<T>
}

// 性别
export enum Gender {
  // 未设置
  Unknown = "unknown",
  // 男
  Male = "male",
  // 女
  Female = "female",
}

// 用户资料
export interface UserProfile {
  // 用户ID
  id: string
  // 账户名
  username?: string
  // 昵称
  nickname?: string
  // 真实姓名
  real_name?: string
  // 手机号
  mobile?: string
  // 座机电话
  tel?: string
  // 邮箱
  email?: string
  // 头像URL
  avatar?: string
  // 二维码URL
  qrcode?: string
  // 性别
  gender?: Gender
  // 国家
  country?: string
  // 省份
  province?: string
  // 城市
  city?: string
  // 区
  district?: string
  // 地址
  address?: string
  // 签名
  signature?: string
  // 生日
  birthday?: Date
  // 公司
  company?: string
  // 部门
  department?: string
  // 头衔、职位
  title?: string
  // 语言
  language?: string
  // 创建时间
  created_at?: Date
  // 最后更新时间
  updated_at?: Date
  // 扩展信息
  metadata?: Record<string, unknown>
}

// 在线状态
export enum Precense {
  // 在线
  Active = "active",
  // 掉线
  Disconnected = "disconnected",
  // 停用
  Disabled = "disabled",
  // 封号
  Banned = "banned",
}

// 账号
export interface Account {
  // 账号ID
  id: string
  // 在线状态
  presence: Precense
  // 平台，如：douyin
  provider: string
  // 平台用户ID，如：抖音ID
  open_id: string
  // 用户自定义ID，如：抖音号
  custom_id?: string
  // 账户名
  username?: string
  // 昵称
  nickname?: string
  // 真实姓名
  real_name?: string
  // 手机号
  mobile?: string
  // 座机电话
  tel?: string
  // 邮箱
  email?: string
  // 头像URL
  avatar?: string
  // 二维码URL
  qrcode?: string
  // 性别
  gender?: Gender
  // 国家
  country?: string
  // 省份
  province?: string
  // 城市
  city?: string
  // 区
  district?: string
  // 地址
  address?: string
  // 签名
  signature?: string
  // 生日
  birthday?: Date
  // 公司
  company?: string
  // 部门
  department?: string
  // 头衔、职位
  title?: string
  // 语言
  language?: string
  // 创建时间
  created_at?: Date
  // 最后更新时间
  updated_at?: Date
  // 扩展信息
  metadata?: Record<string, unknown>
}

// 好友
export interface Contact {
  // 好友ID
  id: string
  // 归属账号ID
  account: string
  // 平台，如：douyin
  provider: string
  // 平台用户ID，如：抖音ID
  open_id: string
  // 用户自定义ID，如：抖音号
  custom_id?: string
  // 账户名
  username?: string
  // 昵称
  nickname?: string
  // 真实姓名
  real_name?: string
  // 手机号
  mobile?: string
  // 座机电话
  tel?: string
  // 邮箱
  email?: string
  // 头像URL
  avatar?: string
  // 二维码URL
  qrcode?: string
  // 性别
  gender?: Gender
  // 国家
  country?: string
  // 省份
  province?: string
  // 城市
  city?: string
  // 区
  district?: string
  // 地址
  address?: string
  // 签名
  signature?: string
  // 生日
  birthday?: Date
  // 公司
  company?: string
  // 部门
  department?: string
  // 头衔、职位
  title?: string
  // 语言
  language?: string
  // 备注名
  alias?: string
  // 备注说明
  remark?: string
  // 标签
  tags?: Array<string>
  // 是否加入黑名单
  blocked?: boolean
  // 是否星标
  marked?: boolean
  // 创建时间
  created_at?: Date
  // 最后更新时间
  updated_at?: Date
  // 扩展信息
  metadata?: Record<string, unknown>
}

// 好友申请状态
export enum FriendApplicationStatus {
  // 待处理
  Unhandled = "unhandled",
  // 已通过
  Accepted = "accepted",
  // 已拒绝
  Rejected = "rejected",
  // 已过期
  Expired = "expired",
}

// 好友申请
export interface FriendApplication {
  // 申请ID
  id: string
  // 归属账号ID
  account: string
  // 平台，如：douyin
  provider: string
  // 平台用户ID，如：抖音ID
  open_id: string
  // 用户自定义ID，如：抖音号
  custom_id?: string
  // 昵称
  nickname?: string
  // 真实姓名
  real_name?: string
  // 头像URL
  avatar?: string
  // 性别
  gender?: Gender
  // 国家
  country?: string
  // 省份
  province?: string
  // 城市
  city?: string
  // 区
  district?: string
  // 签名
  signature?: string
  // 公司
  company?: string
  // 部门
  department?: string
  // 头衔、职位
  title?: string
  // 申请留言
  hello_message?: string
  // 申请来源
  source?: string
  // 状态
  status: FriendApplicationStatus
}

// 会话类型
export enum ConversationType {
  // 私聊
  Private = "private",
  // 群聊
  Group = "group",
  // 系统通知
  System = "system",
}

// 会话
export interface Conversation {
  // 会话ID
  id: string
  // 所属账号ID
  account: string
  // 平台
  provider: string
  // 平台会话ID
  conversation_id?: string
  // 会话类型
  type: ConversationType
  // 私聊会话的对方用户资料
  user?: UserProfile
  // 群聊会话的群组资料
  group?: Group
  // 最后消息
  last_message?: Message
  // 最后活跃时间
  active_at: Date
  // 未读消息数量
  unread: number
  // 是否置顶
  pinned: boolean
  // 创建时间
  created_at?: Date
  // 最后更新时间
  updated_at?: Date
  // 扩展信息
  metadata?: Record<string, unknown>
}

// 消息类型
export enum MessageType {
  // 文本消息
  Text = "text",
  // 图片消息
  Image = "image",
  // 语音消息
  Audio = "audio",
  // 视频消息
  Video = "video",
  // 文件消息
  File = "file",
  // 地理位置消息
  Location = "location",
  // 分享链接消息
  Link = "link",
  // 小程序消息
  Miniprogram = "miniprogram",
  // 好友名片消息
  UserCard = "user_card",
  // 视频号名片消息
  VideoCard = "video_card",
  // 公众号名片消息
  OfficialCard = "official_card",
  // 聊天记录消息
  ChatHistory = "chat_history",
  // 视频号动态消息
  VideoFeed = "video_feed",
  // 直播间消息
  Live = "live",
  // 音乐消息
  Music = "music",
  // 笔记消息
  Note = "note",
}

// 消息发送状态
export enum MessageStatus {
  // 未发送
  Unsent = "unsent",
  // 发送中
  Sending = "sending",
  // 发送成功
  Succeeded = "succeeded",
  // 发送失败
  Failed = "failed",
}

// 消息发送方向
export enum MessageFlow {
  // 接收消息
  In = "in",
  // 发出消息
  Out = "out",
}

export const MESSAGE_MENTIONED_ALL = "@all"

// 消息
export interface Message {
  // 消息ID
  id: string
  // 所属账号ID
  account: string
  // 平台
  provider: string
  // 平台消息ID
  message_id: string
  // 所属会话ID
  conversation_id: string
  // 所属会话类型
  conversation_type: ConversationType
  // 发送人ID
  from: string
  // 接收人ID/接受群组ID
  to: string
  // 消息的流向
  flow: MessageFlow
  // 发送人昵称
  nickname?: string
  // 发送人头像
  avatar?: string
  // 消息类型
  type: MessageType
  // 文本消息内容
  text?: string
  // 图片消息内容
  image?: ImageMessagePayload
  // 语音消息内容
  audio?: AudioMessagePayload
  // 视频消息内容
  video?: VideoMessagePayload
  // 群文本消息@用户ID列表，如果是 @all 则是 MESSAGE_MENTIONED_ALL
  mentioned_users?: Array<string>
  // 消息编号，在会话内递增
  seq: number
  // 发送时间
  sent_at: Date
  // 是否撤回
  revoked?: boolean
  // 状态
  status: MessageStatus
  // 创建时间
  created_at?: Date
  // 最后更新时间
  updated_at?: Date
  // 扩展信息
  metadata?: Record<string, unknown>
}

// 图片消息内容
export interface ImageMessagePayload {
  // 图片地址
  url: string
  // 宽度（像素）
  width?: number
  // 高度（像素）
  height?: number
  // 大小（字节）
  size?: number
  // 格式
  format?: string
  // 文件md5校验
  md5?: string
  // 缩略图地址
  thumbnail?: string
}

// 语音消息内容
export interface AudioMessagePayload {
  // 语音地址
  url: string
  // 时长（秒）
  duration?: number
  // 大小（字节）
  size?: number
  // 格式
  format?: string
  // 文件md5校验
  md5?: string
}

// 视频消息内容
export interface VideoMessagePayload {
  // 视频地址
  url: string
  // 时长（秒）
  duration?: number
  // 宽度（像素）
  width?: number
  // 高度（像素）
  height?: number
  // 大小（字节）
  size?: number
  // 格式
  format?: string
  // 文件md5校验
  md5?: string
  // 封面图
  snapshot?: string
}

// 消息内容
export type MessagePayload =
  | string
  | ImageMessagePayload
  | AudioMessagePayload
  | VideoMessagePayload

// 群组
export interface Group {
  // 群组ID
  id: string
  // 所属账号ID
  account: string
  // 平台
  provider: string
  // 平台群组ID
  group_id: string
  // 群主用户ID
  owner?: string
  // 群组名称
  name?: string
  // 群组头像
  avatar?: string
  // 群二维码
  qrcode?: string
  // 群组备注名
  alias?: string
  // 备注说明
  remark?: string
  // 群公告
  announcement?: string
  // 简介
  description?: string
  // 群成员数量
  member_count?: number
  // 创建时间
  created_at?: Date
  // 最后更新时间
  updated_at?: Date
  // 扩展信息
  metadata?: Record<string, unknown>
}

// 群成员角色
export enum GroupMemberRole {
  // 普通成员
  Member = "member",
  // 管理员
  Admin = "admin",
  // 群主
  Owner = "owner",
}

// 群成员
export interface GroupMember {
  // 群成员ID
  id: string
  // 所属群组ID
  group_id: string
  // 平台
  provider: string
  // 平台群成员ID
  member_id: string
  // 角色
  role: GroupMemberRole
  // 昵称
  nickname?: string
  // 头像
  avatar?: string
  // 性别
  gender?: Gender
  // 群内昵称
  alias?: string
  // 入群时间
  joined_at?: Date
  // 创建时间
  created_at?: Date
  // 最后更新时间
  updated_at?: Date
  // 扩展信息
  metadata?: Record<string, unknown>
}

// 入群申请状态
export type GroupApplicationStatus = FriendApplicationStatus

// 入群申请
export interface GroupApplication {
  // 申请ID
  id: string
  // 群组ID
  group_id: string
  // 平台，如：douyin
  provider: string
  // 平台用户ID，如：抖音ID
  open_id: string
  // 用户自定义ID，如：抖音号
  custom_id?: string
  // 昵称
  nickname?: string
  // 真实姓名
  real_name?: string
  // 头像URL
  avatar?: string
  // 性别
  gender?: Gender
  // 国家
  country?: string
  // 省份
  province?: string
  // 城市
  city?: string
  // 区
  district?: string
  // 签名
  signature?: string
  // 公司
  company?: string
  // 部门
  department?: string
  // 头衔、职位
  title?: string
  // 申请留言
  hello_message?: string
  // 申请来源
  source?: string
  // 状态
  status: GroupApplicationStatus
}

export enum MomentType {
  // 文字动态
  Text = "text",
  // 图片动态
  Image = "image",
  // 视频动态
  Video = "video",
}

// 用户动态
export interface Moment {
  // 动态ID
  id: string
  // 平台
  provider: string
  // 平台动态ID
  moment_id: string
  // 发布用户ID
  user_id: string
  // 动态类型
  type: MomentType
  // 文案
  text?: string
  // 图片
  images?: Array<ImageMomentContent>
  // 视频
  video?: VideoMomentContent
  // 发布时间
  published_at: Date
  // 点赞数
  like_count?: number
  // 点赞列表
  likes?: CursorList<Like>
  // 评论数
  comment_count?: number
  // 评论列表
  comments?: CursorList<Comment>
  // 创建时间
  created_at?: Date
  // 最后更新时间
  updated_at?: Date
  // 扩展信息
  metadata?: Record<string, unknown>
}

// 图片动态内容
export interface ImageMomentContent {
  // 图片地址
  url: string
  // 宽度（像素）
  width?: number
  // 高度（像素）
  height?: number
  // 大小（字节）
  size?: number
  // 格式
  format?: string
  // 文件md5校验
  md5?: string
  // 缩略图地址
  thumbnail?: string
}

// 视频动态内容
export interface VideoMomentContent {
  // 视频地址
  url: string
  // 时长（秒）
  duration?: number
  // 宽度（像素）
  width?: number
  // 高度（像素）
  height?: number
  // 大小（字节）
  size?: number
  // 格式
  format?: string
  // 文件md5校验
  md5?: string
  // 封面图
  snapshot?: string
}

// 动态内容类型
export type MomentContent = ImageMomentContent | VideoMomentContent

// 评论
export interface Comment {
  // 评论ID
  id: string
  // 发表评论用户ID
  user_id: string
  // 发表评论用户名称
  name?: string
  // 发表评论用户头像
  avatar?: string
  // 评论文案
  text?: string
  // 评论时间
  commented_at?: Date
  // 回复的评论
  reply_to?: Comment
  // 回复列表
  replies?: CursorList<Comment>
}

// 点赞
export interface Like {
  // 点赞ID
  id: string
  // 点赞用户ID
  user_id: string
  // 点赞用户名称
  name?: string
  // 点赞用户头像
  avatar?: string
}

// TODO deprecated

export interface ClientEvent<T> {
  // 与事件关联的请求ID
  request_id?: string
  // 事件类型
  type: string
  // 事件数据
  data: T
}
