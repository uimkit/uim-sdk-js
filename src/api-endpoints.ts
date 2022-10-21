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
  // 查询指定服务商的账号
  provider?: string
  // 获得账号后是否订阅账号事件
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

export type CreateConversationParameters = {
  account_id: string
  user_id?: string
  group_id?: string
}

export type CreateConversationResponse = Conversation

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

export type SendPrivateMessageParameters = {
  // 发送方，规则：{平台用户ID}@{平台}/{服务商}，例如：wxid_abc@wechat/provider
  // 服务商参数可选，如果未提供，使用默认的服务商
  from: string
  // 接收方，规则：{平台用户ID}@{平台}/{服务商}，例如：wxid_abc@wechat/provider
  // 服务商参数可选，如果未提供，使用默认的服务商
  to: string
  // 消息内容
  message: MessagePayload
  // 自定义数据，在返回中透传回来
  state?: string
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
  // 自定义数据，在返回中透传回来
  state?: string
}

export type SendGroupMessageResponse = Message
