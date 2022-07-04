// cspell:disable-file

type PageListQueryParameters<T> = T & {
  offset?: number
  limit?: number
}

const pageListQueryParams = ["offset", "limit"]

type PageListExtra = {
  offset: number
  limit: number
  total: number
}

type PageListResponse<T> = {
  extra: PageListExtra
  data: Array<T>
}

type Cursor = string | number

type CursorDirection = "after" | "before"

type CursorListQueryParameters<T> = T & {
  cursor?: Cursor
  direction?: CursorDirection
  limit?: number
}

const cursorListQueryParams = ["cursor", "direction", "limit"]

type CursorListExtra = {
  hasPrevious: boolean
  hasNext: boolean
  start_cursor: Cursor
  end_cursor: Cursor
}

type CursorListResponse<T> = {
  extra: CursorListExtra
  data: Array<T>
}

type EmptyObject = Record<string, never>

type WithMetadata<T> = T & {
  metadata?: Record<string, unknown>
}

type WithTimestamps<T> = T & {
  created_at: Date
  updated_at?: Date
}

type Model<T> = WithTimestamps<WithMetadata<T>>

type UnknownGender = 0
type Male = 1
type Female = 2
type Gender = UnknownGender | Male | Female

type IMIdentity = {
  id: string
  user_id: string
  open_id: string
  provider: string
}

type IMUser = Model<{
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

type PresenceOnline = 1
type PresenceOffline = 2
type PresenceLogout = 3
type PresenceDisabled = 4
type PresenceDisabledByProvider = 5
type Presence =
  | PresenceOnline
  | PresenceOffline
  | PresenceLogout
  | PresenceDisabled
  | PresenceDisabledByProvider

type IMAccount = Model<{
  id: string
  user: IMUser
  precense: Presence
}>

type Contact = Model<{
  id: string
  account_id: string
  user: IMUser
  alias?: string
  remark?: string
  tags?: Array<string>
  blocked?: boolean
  marked?: boolean
}>

type Group = Model<{
  id: string
  group_id: string
  owner?: IMUser
  name?: string
  avatar?: string
  announcement?: string
  description?: string
  member_count: number
}>

type GroupMember = Model<{
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
  CustomerService = 5
}

type Conversation = Model<{
  id: string
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

type MentionedTypeAll = 1
type MentionedTypeSingle = 2
type MentionedType = MentionedTypeAll | MentionedTypeSingle

type Message = Model<{
  id: string
  message_id: string
  conversation_type: ConversationType
  seq: number
  from: string
  to: string
  sent_at: Date
  revoked?: boolean
  mentioned_type?: MentionedType
  mentioned_users?: Array<IMUser>
  payload:
  | TextMessagePayload
  | ImageMessagePayload
  | VoiceMessagePayload
  | VideoMessagePayload
}>

type TextMessagePayload = {
  type: 1
  body: {
    content: string
  }
}

type ImageMessagePayload = {
  type: 2
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

type VoiceMessagePayload = {
  type: 3
  body: {
    url: string
    duration?: number
    size?: number
    ext?: string
    md5?: string
  }
}

type VideoMessagePayload = {
  type: 4
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

type Moment = Model<{
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

type TextMomentContent = {
  type: 1
  body: {
    content: string
  }
}

type ImagesMomentContent = {
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

type VideoMomentContent = {
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

type GetIMAccountPathParameters = {
  id: string
}

type GetIMAccountOptions = {
  subscribe?: boolean
}

export type GetIMAccountParameters = GetIMAccountPathParameters & GetIMAccountOptions

export type GetIMAccountResponse = IMAccount

export const getIMAccount = {
  method: "get",
  pathParams: ["id"],
  queryParams: [],
  bodyParams: [],
  path: (p: GetIMAccountPathParameters): string => `im_accounts/${p.id}`,
} as const

type ListIMAccountsPathParameters = EmptyObject

type ListIMAccountsQueryParameters = PageListQueryParameters<EmptyObject>

type ListIMAccountsOptions = {
  subscribe?: boolean
}

export type ListIMAccountsParameters = ListIMAccountsPathParameters &
  ListIMAccountsQueryParameters & ListIMAccountsOptions

export type ListIMAccountsResponse = PageListResponse<IMAccount>

export const listIMAccounts = {
  method: "get",
  pathParams: [],
  queryParams: [...pageListQueryParams],
  bodyParams: [],
  path: (_p: ListIMAccountsPathParameters): string => "im_accounts",
} as const

type IMAccountPathParameters = {
  im_account_id: string
}

const imAccountPathParams = ["im_account_id"]

type ListIMAccountContactsPathParameters = IMAccountPathParameters

type ListIMAccountContactsQueryParameters =
  CursorListQueryParameters<EmptyObject>

export type ListIMAccountContactsParameters =
  ListIMAccountContactsPathParameters & ListIMAccountContactsQueryParameters

export type ListIMAccountContactsResponse = CursorListResponse<Contact>

export const listIMAccountContacts = {
  method: "get",
  pathParams: [...imAccountPathParams],
  queryParams: [...cursorListQueryParams],
  bodyParams: [],
  path: (p: ListIMAccountContactsPathParameters): string =>
    `im_accounts/${p.im_account_id}/contacts`,
} as const

type ListIMAccountGroupsPathParameters = IMAccountPathParameters

type ListIMAccountGroupsQueryParameters = PageListQueryParameters<EmptyObject>

export type ListIMAccountGroupsParameters = ListIMAccountGroupsPathParameters &
  ListIMAccountGroupsQueryParameters

export type ListIMAccountGroupsResponse = PageListResponse<Group>

export const listIMAccountGroups = {
  method: "get",
  pathParams: [...imAccountPathParams],
  queryParams: [...pageListQueryParams],
  bodyParams: [],
  path: (p: ListIMAccountGroupsPathParameters): string =>
    `im_accounts/${p.im_account_id}/groups`,
} as const

type ListIMAccountConversationsPathParameters = IMAccountPathParameters

type ListIMAccountConversationsQueryParameters =
  CursorListQueryParameters<EmptyObject>

export type ListIMAccountConversationsParameters =
  ListIMAccountConversationsPathParameters &
  ListIMAccountConversationsQueryParameters

export type ListIMAccountConversationsResponse =
  CursorListResponse<Conversation>

export const listIMAccountConversations = {
  method: "get",
  pathParams: [...imAccountPathParams],
  queryParams: [...cursorListQueryParams],
  bodyParams: [],
  path: (p: ListIMAccountConversationsPathParameters): string =>
    `im_accounts/${p.im_account_id}/conversations`,
} as const

type GetContactPathParameters = {
  id: string
}

export type GetContactParameters = GetContactPathParameters

export type GetContactResponse = Contact

export const getContact = {
  method: "get",
  pathParams: ["id"],
  queryParams: [],
  bodyParams: [],
  path: (p: GetContactPathParameters): string => `contacts/${p.id}`,
} as const

type GetGroupPathParameters = {
  id: string
}

export type GetGroupParameters = GetGroupPathParameters

export type GetGroupResponse = Group

export const getGroup = {
  method: "get",
  pathParams: ["id"],
  queryParams: [],
  bodyParams: [],
  path: (p: GetGroupPathParameters): string => `groups/${p.id}`,
} as const

type GroupPathParameters = {
  group_id: string
}

const groupPathParams = ["group_id"]

type ListGroupMembersPathParameters = GroupPathParameters

type ListGroupMembersQueryParameters = PageListQueryParameters<EmptyObject>

export type ListGroupMembersParameters = ListGroupMembersPathParameters &
  ListGroupMembersQueryParameters

export type ListGroupMembersResponse = PageListResponse<GroupMember>

export const listGroupMembers = {
  method: "get",
  pathParams: [...groupPathParams],
  queryParams: [...pageListQueryParams],
  bodyParams: [],
  path: (p: ListGroupMembersPathParameters): string =>
    `groups/${p.group_id}/members`,
} as const

type IMUserPathParameters = {
  user_id: string
}

const imUserPathParams = ["user_id"]

type ListIMUserMomentsPathParameters = IMUserPathParameters

type ListIMUserMomentsQueryParameters = CursorListQueryParameters<EmptyObject>

export type ListIMUserMomentsParameters = ListIMUserMomentsPathParameters &
  ListIMUserMomentsQueryParameters

export type ListIMUserMomentsResponse = CursorListResponse<Moment>

export const listIMUserMoments = {
  method: "get",
  pathParams: [...imUserPathParams],
  queryParams: [...cursorListQueryParams],
  bodyParams: [],
  path: (p: ListIMUserMomentsPathParameters): string =>
    `im_users/${p.user_id}/moments`,
} as const

type ConversationPathParameters = {
  conversation_id: string
}

const conversationPathParams = ["conversation_id"]

type ListConversationMessagesPathParameters = ConversationPathParameters

type ListConversationMessagesQueryParameters =
  CursorListQueryParameters<EmptyObject>

export type ListConversationMessagesParameters =
  ListConversationMessagesPathParameters &
  ListConversationMessagesQueryParameters

export type ListConversationMessagesResponse = CursorListResponse<Message>

export const listConversationMessages = {
  method: "get",
  pathParams: [...conversationPathParams],
  queryParams: [...cursorListQueryParams],
  bodyParams: [],
  path: (p: ListConversationMessagesPathParameters): string =>
    `conversations/${p.conversation_id}/messages`,
} as const

type SendMessageParameters = {
  mentioned_type?: MentionedType
  mentioned_user_ids?: Array<string>
  payload:
  | TextMessagePayload
  | ImageMessagePayload
  | VoiceMessagePayload
  | VideoMessagePayload
}

export type SendConversationMessageParameters = SendMessageParameters & {
  account_id: string
  conversation_id: string
}

export type SendGroupMessageParameters = SendMessageParameters & {
  account_id: string
  group_id: string
}

export type SendPrivateMessageParameters = SendMessageParameters & {
  account_id: string
  user_id: string
}

export enum PublishEventType {
  SendMessage = "send_message"
}

export type PublishEvent =
  | SendMessageEvent

export type SendMessageEvent = {
  type: "send_message"
  payload: SendMessageParameters & {
    conversation_id?: string
    conversation_type?: ConversationType
    from?: string
    to?: string
  }
}

export enum SubscribeEventType {
  NewMessage = "new_message"
}

export type SubscribeEvent =
  | NewMessageEvent

export type NewMessageEvent = {
  type: "new_message"
  payload: Message
}