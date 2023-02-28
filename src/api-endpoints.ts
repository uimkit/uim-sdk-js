// cspell:disable-file

import {
  PageListParameters,
  PageList,
  CursorListParameters,
  CursorList,
  Contact,
  Conversation,
  Group,
  GroupMember,
  Account,
  Message,
  Moment,
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

// 查询好友列表请求
export type ListContactsParameters = CursorListParameters<{
  // 查询指定账号的好友列表
  account_id: string
}>

// 查询好友列表结果
export type ListContactsResponse = CursorList<Contact>

// 查询群组列表
export type ListGroupsParameters = PageListParameters<{
  // 查询指定账号的群组列表
  account_id: string
}>

// 查询群组列表结果
export type ListGroupsResponse = PageList<Group>

// 查询会话列表请求
export type ListConversationsParameters = CursorListParameters<{
  account_id: string
}>

// 查询会话列表结果
export type ListConversationsResponse = CursorList<Conversation>

// 添加好友请求
export type AddContactParameters = {
  // 账号ID
  account_id: string
  // 联系人，可以为手机号、平台ID等
  contact: string
  // 打招呼留言
  hello_message?: string
}

// 添加好友结果
export type AddContactResponse = {
  // 好友申请是否发送成功
  success: boolean
  // 如果失败，返回失败的原因
  reason?: string
}

// 查询群成员列表请求
export type ListGroupMembersParameters = PageListParameters<{
  group_id: string
}>

// 查询群成员列表结果
export type ListGroupMembersResponse = PageList<GroupMember>

// 查询消息列表请求
export type ListMessagesParameters = CursorListParameters<{
  conversation_id: string
}>

// 查询消息列表结果
export type ListMessagesResponse = CursorList<Message>

// 查询账号的动态列表请求
export type ListAccountMomentsParameters = CursorListParameters<{
  account_id: string
}>

// 查询好友的动态列表请求
export type ListContactMomentsParameters = CursorListParameters<{
  contact_id: string
}>

// 查询动态列表结果
export type ListMomentsResponse = CursorList<Moment>

// 直接发送消息给目标
export type SendMessageDirectParameters = Pick<
  Message,
  | "from"
  | "to"
  | "conversation_type"
  | "type"
  | "text"
  | "image"
  | "audio"
  | "video"
>

// 发送消息到会话
export type SendMessageToConversationParameters = Pick<
  Message,
  "conversation_id" | "type" | "text" | "image" | "audio" | "video"
>

// 发送消息，可以直接发送，也可以发送到会话
export type SendMessageParameters =
  | SendMessageDirectParameters
  | SendMessageToConversationParameters
