// cspell:disable-file

export type EmptyObject = Record<string, unknown>

export type PageListQueryParameters<T> = T & {
  offset?: number
  limit?: number
}

export const pageListQueryParams = ["offset", "limit"]

export type PageListExtra = {
  offset: number
  limit: number
  total: number
}

export type PageListResponse<T> = {
  extra: PageListExtra
  data: Array<T>
}

export type Cursor = string | number

export type CursorDirection = "after" | "before"

export type CursorListQueryParameters<T> = T & {
  cursor?: Cursor
  direction?: CursorDirection
  limit?: number
}

export const cursorListQueryParams = ["cursor", "direction", "limit"]

export type CursorListExtra = {
  start_cursor?: Cursor
  end_cursor?: Cursor
  has_previous: boolean
  has_next: boolean
  limit: number
}

export type CursorListResponse<T> = {
  extra: CursorListExtra
  data: Array<T>
}

export type WithMetadata<T> = T & {
  metadata?: Record<string, unknown>
}

export type WithTimestamps<T> = T & {
  created_at: number
  updated_at?: number
}

export type Model<T> = WithTimestamps<WithMetadata<T>>

export interface ClientEvent<T> {
  // 与事件关联的请求ID
  request_id?: string
  // 事件类型
  type: string
  // 事件数据
  data: T
}

export enum Gender {
  Unknown = 0,
  Male = 1,
  Female = 2,
}

export type IMIdentity = {
  id: string
  user_id: string
  open_id: string
  provider: string
}

export type IMUser = Model<{
  id: string
  user_id: string
  custom_id?: string
  username?: string
  name?: string
  real_name?: string
  mobile?: string
  email?: string
  avatar?: string
  qrcode?: string
  gender?: Gender
  country?: string
  province?: string
  city?: string
  district?: string
  address?: string
  signature?: string
  birthday?: number
  company?: string
  department?: string
  title?: string
  language?: string
  identities?: Array<IMIdentity>
}>

// 账号在线状态
export enum Precense {
  // 初始化中
  Initializing = 0,
  // 在线
  Online = 1,
  // 离线
  Offline = 2,
  // 登出
  Logout = 3,
  // 禁用
  Disabled = 4,
  // 平台封号
  DisabledByProvider = 5,
}

// 账号信息
export type IMAccount = Model<{
  // 账号用户的ID
  id: string
  // 在线状态
  presence: Precense
  // 平台，如：douyin
  provider: string
  // 平台用户ID，如：抖音ID
  open_id: string
  // 用户自定义ID，如：抖音号
  custom_id?: string
  // 用户账户
  username?: string
  // 名称
  name?: string
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
  birthday?: number
  // 公司
  company?: string
  // 部门
  department?: string
  // 头衔、职位
  title?: string
  // 语言
  language?: string
  // 扩展信息
  metadata?: unknown
  // 创建时间
  created_at?: number
  // 最后更新时间
  updated_at?: number
}>

// 好友信息
export type Contact = Model<{
  // 好友用户的ID
  id: string
  // 归属账号的用户ID
  account: string
  // 平台，如：douyin
  provider: string
  // 平台用户ID，如：抖音ID
  open_id: string
  // 用户自定义ID，如：抖音号
  custom_id?: string
  // 用户账户
  username?: string
  // 名称
  name?: string
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
  birthday?: number
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
  // 备注
  remark?: string
  // 标签
  tags?: Array<string>
  // 黑名单
  blocked?: boolean
  // 星标
  marked?: boolean
  // 扩展信息
  metadata?: unknown
  // 创建时间
  created_at?: number
  // 最后更新时间
  updated_at?: number
}>

export type Group = Model<{
  id: string
  groupid: string
  owner?: IMUser
  name?: string
  avatar?: string
  announcement?: string
  description?: string
  member_count: number
}>

export type GroupMember = Model<{
  id: string
  member_id: string
  group_id: string
  user: IMUser
  is_owner?: boolean
  is_admin?: boolean
  alias?: string
}>

export enum ConversationType {
  Private = "private",
  Group = "group",
  Discussion = "discussion",
  System = "system",
  CustomerService = "customer_service",
}

export type Conversation = Model<{
  // 会话ID
  id: string
  // 所属账号的IM用户ID
  account: string
  // 平台 
  provider: string
  // 消息收发地址
  channel: string
  // 对方ID，私聊是对方IM用户ID，群聊是群组ID
  participant: string
  // 对方名称
  name?: string
  // 对方头像
  avatar?: string
  // 会话类型
  type: ConversationType
  // 最后消息
  last_message?: Message
  // 最后消息时间
  last_message_at?: number
  // 最后活跃时间
  active_at?: number
  // 未读数量
  unread: number
  // 是否置顶
  pinned: boolean
  // 扩展信息
  metadata?: unknown
  // 创建时间
  created_at?: number
  // 最后更新时间
  updated_at?: number
}>

export enum MentionedType {
  All = 1,
  Single = 2,
}

export type Message = Model<{
  // 消息唯一ID
  id: string
  // 平台 
  provider: string
  // 平台消息ID
  message_id: string
  // 所属会话ID
  conversation_id: string
  // 所属账号的IM用户ID
  account: string
  // 发消息的IM用户ID
  user_id: string
  // 发消息的名称
  name?: string
  // 发消息的头像
  avatar?: string
  // 消息类型 
  type: MessageType
  // 文本消息内容
  text?: string
  // 图片消息内容
  image?: ImageMessageBody
  // 语音消息内容
  voice?: VoiceMessageBody
  // 视频消息内容
  video?: VideoMessageBody
  // 消息编号，在会话内有序递增
  seq: number
  // 发送时间
  sent_at: number
  // 是否撤回
  revoked?: boolean
  // 是否发送中
  sending?: boolean
  // 是否发送成功
  succeeded?: boolean
  // 是否发送失败
  failed?: boolean
  // 发送失败原因
  failed_reason?: string
  // 扩展信息
  metadata?: unknown
}>

export enum MessageType {
  // 文本消息
  Text = "text",
  // 图片消息
  Image = "image",
  // 语音消息
  Voice = "voice",
  // 视频消息
  Video = "video",
}

export type MessageBody =
  | string
  | ImageMessageBody
  | VoiceMessageBody
  | VideoMessageBody

export type ImageMessageBody = {
  url: string
  width?: number
  height?: number
  size?: number
  ext?: string
  md5?: string
  thumb?: {
    url: string
    width?: number
    height?: number
    ext?: string
  }
}

export type VoiceMessageBody = {
  url: string
  duration?: number
  size?: number
  ext?: string
  md5?: string
}

export type VideoMessageBody = {
  url: string
  duration?: number
  width?: number
  height?: number
  size?: number
  ext?: string
  md5?: string
  thumb?: {
    url: string
    width?: number
    height?: number
    ext?: string
  }
}

export type Moment = Model<{
  id: string
  moment_id: string
  user: IMUser
  published_at: number
  is_private?: boolean
  tags?: Array<string>
  location?: {
    latitude?: number
    longitude?: number
    altitude?: number
    accuracy?: number
    city?: string
    place_name?: string
    poi_name?: string
    poi_address?: string
  }
  content: TextMomentContent | ImagesMomentContent | VideoMomentContent
}>

export type TextMomentContent = {
  type: 1
  body: {
    content: string
  }
}

export type ImagesMomentContent = {
  type: 2
  body: {
    text?: string
    images?: Array<{
      url: string
      width?: number
      height?: number
      size?: number
      ext?: string
      md5?: string
      thumb?: {
        url: string
        width?: number
        height?: number
        ext?: string
      }
    }>
  }
}

export type VideoMomentContent = {
  type: 3
  body: {
    text?: string
    url: string
    duration?: number
    width?: number
    height?: number
    size?: number
    ext?: string
    md5?: string
    thumb?: {
      url: string
      width?: number
      height?: number
      ext?: string
    }
  }
}
