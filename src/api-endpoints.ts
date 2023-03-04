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
  FriendApplication,
  GroupMemberRole,
  GroupApplication,
  ImageMessagePayload,
  AudioMessagePayload,
  VideoMessagePayload,
  MessageType,
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

// 查询好友申请列表请求
export type ListFriendApplicationsParameters = PageListParameters<{
  // 查询指定账号的好友申请列表
  account_id: string
}>

// 查询好友申请列表结果
export type ListFriendApplicationsResponse = PageList<FriendApplication>

// 查询群组列表
export type ListGroupsParameters = PageListParameters<{
  // 查询指定账号的群组列表
  account_id: string
  // 根据标记状态过滤群组
  marked?: boolean
}>

// 创建群组请求
export type CreateGroupParameters = {
  // 用于创建群组的账号
  account_id: string
  // 邀请的好友ID列表
  members: Array<string>
  // 邀请成员留言
  hello_message?: string
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
}

// 转让群组
export type TransferGroupParameters = {
  // 群组ID
  group_id: string
  // 新群主ID
  owner_id: string
}

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

// 邀请好友加入群组
export type InviteGroupMembersParameters = {
  // 发出邀请的账号
  account_id: string
  // 群组ID
  group_id: string
  // 邀请好友ID列表
  contacts: Array<string>
  // 邀请留言
  hello_message?: string
}

// 邀请好友加入群组结果
export type InviteGroupMembersResponse = {
  // 邀请是否全部发送成功
  success: boolean
  // 邀请失败的好友及原因
  failed_contacts: Array<{
    // 失败的好友ID
    contact_id: string
    // 失败的原因
    reason?: string
  }>
}

// 设置群成员角色
export type SetGroupMemberRoleParameters = {
  // 操作的群管理员账号
  account_id: string
  // 群组ID
  group_id: string
  // 群成员ID
  member_id: string
  // 设置角色
  role: GroupMemberRole
}

// 查询入群申请列表请求
export type ListGroupApplicationsParameters = PageListParameters<{
  group_id: string
}>

// 查询入群申请列表结果
export type ListGruopApplicationsResponse = PageList<GroupApplication>

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

// 发送消息请求
export type SendMessageParameters = Partial<Message> & {
  // 待上传的文件
  file?: File
  // 文件上传进度回调
  upload_progress?: (percent: number) => void
}

// 消息发送目标
export type MessageTargetParameters =
  // 直接发送给对方
  | Pick<Message, "from" | "to" | "conversation_type">
  // 发送到会话
  | Pick<Message, "conversation_id">

// 创建消息参数
export type CreateMessageParameters = MessageTargetParameters & Pick<Message, 'text' | 'image' | 'audio' | 'video'> & {
  // 待上传的文件
  file?: HTMLInputElement | File
  // 文件上传进度回调
  upload_progress?: (percent: number) => void
}