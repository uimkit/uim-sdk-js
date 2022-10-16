// cspell:disable-file

import {
  Contact,
  Conversation,
  CursorListQueryParameters,
  CursorListResponse,
  EmptyObject,
  Group,
  GroupMember,
  IMAccount,
  MentionedType,
  Message,
  MessagePayload,
  Moment,
  PageListQueryParameters,
  PageListResponse,
} from "./models"

export type RetrieveIMAccountParameters = {
  account_id: string
  subscribe?: boolean
}

export type RetrieveIMAccountResponse = IMAccount

export type ListIMAccountsParameters = PageListQueryParameters<EmptyObject> & {
  subscribe?: boolean
}

export type ListIMAccountsResponse = PageListResponse<IMAccount>

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

export type RetrieveContactParameters = {
  account_id: string
  user_id: string
}

export type RetrieveContactResponse = Contact

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

export type SendPrivateMessageParameters = {
  // 发送方，规则：{平台用户ID}@{平台}/{服务商}，例如：wxid_abc@wechat/provider
  // 服务商参数可选，如果未提供，使用默认的服务商
  from: string
  // 接收方，规则：{平台用户ID}@{平台}/{服务商}，例如：wxid_abc@wechat/provider
  // 服务商参数可选，如果未提供，使用默认的服务商
  to: string
  // 消息内容
  message: MessagePayload
}

export type SendPrivateMessageResponse = Message

export type SendGroupMessageParameters = {
  // 发送方，规则：{平台用户ID}@{平台}/{服务商}，例如：wxid_abc@wechat/provider
  // 服务商参数可选，如果未提供，使用默认的服务商
  from: string
  // 接收方，规则：{平台群组ID}@{平台}/{服务商}
  // 服务商参数可选，如果未提供，使用默认的服务商
  to: string
  // 消息内容
  message: MessagePayload
  // @人类型
  mentioned_type?: MentionedType
  // @人列表，为平台用户ID
  mentioned_user_ids?: string[]
}

export type SendGroupMessageResponse = Message
