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

export enum Presence {
  Online = 1,
  Offline = 2,
  Logout = 3,
  Disabled = 4,
  DisabledByProvider = 5,
}

export type IMAccount = Model<{
  id: string
  user: IMUser
  precense: Presence
}>

export type Contact = Model<{
  id: string
  account_id: string
  user: IMUser
  alias?: string
  remark?: string
  tags?: Array<string>
  blocked?: boolean
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
  id: string
  account_id: string
  type: ConversationType
  to: {
    id: string
    name?: string
    avatar?: string
  }
  lastMessage?: Message
  lastMessageAt?: Date
  unread: number
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
