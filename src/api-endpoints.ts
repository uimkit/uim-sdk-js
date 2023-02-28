// cspell:disable-file

import {
  Contact,
  Conversation,
  ConversationType,
  CursorListQueryParameters,
  CursorListResponse,
  EmptyObject,
  Group,
  GroupMember,
  Account,
  Message,
  MessageType,
  Moment,
  PageListQueryParameters,
  PageListResponse,
  ImageMessagePayload,
  AudioMessagePayload,
  VideoMessagePayload,
  PageListParameters,
  PageList,
} from "./models"

// 查询账号列表请求
export type ListAccountsParameters = PageListParameters<{
  // 查询指定服务商的账号
  provider?: string
  // 获得账号后是否订阅账号事件
  subscribe?: boolean
}>

// 查询账号列表结果
export type ListAccountsResponse = PageList<Account>

export type ListContactsParameters = CursorListQueryParameters<EmptyObject> & {
  account_id: string
}

export type ListContactsResponse = CursorListResponse<Contact>

export type ListGroupsParameters = PageListQueryParameters<EmptyObject> & {
  account_id: string
}

export type ListGroupsResponse = PageListResponse<Group>

export type ListConversationsParameters =
  CursorListQueryParameters<EmptyObject> & {
    account_id: string
  }

export type ListConversationsResponse = CursorListResponse<Conversation>

export type RetrieveConversationParameters = {
  conversation_id: string
}

export type RetrieveConversationResponse = Conversation

export type RetrieveContactConversationParameters = {
  account_id: string
  user_id: string
}

export type RetrieveContactConversationResponse = Conversation

export type RetrieveGroupConversationParameters = {
  account_id: string
  group_id: string
}

export type RetrieveGroupConversationResponse = Conversation

export type ResetConversationUnreadParameters = {
  conversation_id: string
}

export type ResetConversationUnreadResponse = Conversation

export type RetrieveContactParameters = {
  account_id: string
  user_id: string
}

export type RetrieveContactResponse = Contact

export type AddContactParameters = {
  // 账号ID
  account_id: string
  // 联系人，可以为手机号、平台ID等
  contact: string
  // 打招呼留言
  hello_message?: string
}

export type AddContactResponse = {
  // 好友申请是否发送成功
  success: boolean
  // 如果失败，返回失败的原因
  reason?: string
}

export type RetrieveGroupParameters = {
  account_id: string
  group_id: string
}

export type RetrieveGroupResponse = Group

export type ListGroupMembersParameters =
  PageListQueryParameters<EmptyObject> & {
    group_id: string
  }

export type ListGroupMembersResponse = PageListResponse<GroupMember>

export type ListMomentsParameters = CursorListQueryParameters<EmptyObject> & {
  account_id: string
  user_id?: string
}

export type ListMomentsResponse = CursorListResponse<Moment>

export type ListMessagesParameters = CursorListQueryParameters<EmptyObject> & {
  conversation_id: string
}

export type ListMessagesResponse = CursorListResponse<Message>

// 直接发送消息给目标
export type SendMessageDirectParameters = {
  // 发送方，是账号的IM用户ID
  from: string
  // 接收方，私聊消息时对方的IM用户ID，群聊消息时群ID
  to: string
  // 会话类型，用于识别接收方是私聊还是群聊
  conversation_type: ConversationType
  // 消息类型
  type: MessageType
  // 文本消息内容
  text?: string
  // 图片消息内容
  image?: ImageMessagePayload
  // 音频消息内容
  audio?: AudioMessagePayload
  // 视频消息内容
  video?: VideoMessagePayload
}

// 发送消息到会话
export type SendMessageToConversationParameters = {
  // 会话ID
  conversation_id: string
  // 消息类型
  type: MessageType
  // 文本消息内容
  text?: string
  // 图片消息内容
  image?: ImageMessagePayload
  // 音频消息内容
  audio?: AudioMessagePayload
  // 视频消息内容
  video?: VideoMessagePayload
}

// 发送消息，可以直接发送，也可以发送到会话
export type SendMessageParameters =
  | SendMessageDirectParameters
  | SendMessageToConversationParameters

export type SendMessageResponse = Message

export type ResendMessageParameters = {
  // 重发的消息id
  message_id: string
}
export type ResendMessageResponse = Message

export type DeleteMessageParameters = {
  // 消息id
  message_id: string
}

export type DeleteMessageResponse = any
