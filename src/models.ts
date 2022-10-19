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
  cursor: Cursor
  has_more: boolean
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
  created_at: Date
  updated_at?: Date
}

export type Model<T> = WithTimestamps<WithMetadata<T>>

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
  birthday?: Date
  language?: string
  identities?: Array<IMIdentity>
}>

export enum Precense {
  Online = 1,
  Offline = 2,
  Logout = 3,
  Disabled = 4,
  DisabledByProvider = 5,
}

// 账号信息
export type IMAccount = Model<{
  // 账号唯一ID
  id: string
  // 服务商平台，如：douyin
  provider: string
  // 平台用户ID，如：抖音ID
  user_id: string
  // 用户自定义ID，如：抖音号
  custom_id?: string
  // 在线状态
  presence: Precense
  // 用户账户
  username?: string
  // 名称
  name?: string
  // 手机号
  mobile?: string
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
  // 语言
  language?: string
}>

export type Contact = Model<{
  // 联系人唯一ID
  id: string
  // 平台用户ID，如：抖音ID
  user_id: string
  // 用户自定义ID，如：抖音号
  custom_id?: string
  // 用户账户
  username?: string
  // 名称
  name?: string
  // 手机号
  mobile?: string
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
  Private = 1,
  Group = 2,
  Discussion = 3,
  System = 4,
  CustomerService = 5,
}

export type Conversation = Model<{
  // 会话ID
  id: string
  // 账号ID
  account_id: string
  // 会话类型
  type: ConversationType
  // 对方ID
  party_id: string
  // 对方名称
  party_name?: string
  // 对方头像
  party_avatar?: string
  // 最后消息
  last_message?: Message
  // 最后消息时间
  last_message_at?: Date
  // 未读数量
  unread: number
  // 是否置顶
  pinned: boolean
}>

export enum MentionedType {
  All = 1,
  Single = 2,
}

export type Message = Model<{
  id: string
  message_id: string
  conversation_type: ConversationType
  seq: number
  from: {
    id: string
    name?: string
    avatar?: string
  }
  to: {
    id: string
    name?: string
    avatar?: string
  }
  sent_at: Date
  revoked?: boolean
  mentioned_type?: MentionedType
  mentioned_users?: Array<IMUser>
  payload: MessagePayload
}>

export enum MessageType {
  Text = 1,
  Image = 2,
  Voice = 3,
  Video = 4,
}

export type MessagePayload =
  | TextMessagePayload
  | ImageMessagePayload
  | VoiceMessagePayload
  | VideoMessagePayload

export type TextMessagePayload = {
  type: MessageType.Text
  body: {
    content: string
  }
}

export type ImageMessagePayload = {
  type: MessageType.Image
  body: {
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
}

export type VoiceMessagePayload = {
  type: MessageType.Voice
  body: {
    url: string
    duration?: number
    size?: number
    ext?: string
    md5?: string
  }
}

export type VideoMessagePayload = {
  type: MessageType.Video
  body: {
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

export type Moment = Model<{
  id: string
  moment_id: string
  user: IMUser
  published_at: Date
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
