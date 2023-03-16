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
  Comment,
} from '../models';

// 查询账号列表请求
export type GetAccountListParameters = PageListParameters<{
  // 查询指定服务商的账号
  provider?: string;
}>;

// 查询账号列表结果
export type GetAccountListResponse = PageList<Account>;

// 查询好友列表请求
export type GetContactListParameters = CursorListParameters<{
  // 查询指定账号的好友列表
  account_id: string;
  // 关键字搜索备注名、昵称
  keyword?: string;
}>;

// 查询好友列表结果
export type GetContactListResponse = CursorList<Contact>;

// 查询好友申请列表请求
export type GetFriendApplicationListParameters = PageListParameters<{
  // 查询指定账号的好友申请列表
  account_id: string;
}>;

// 查询好友申请列表结果
export type GetFriendApplicationListResponse = PageList<FriendApplication>;

// 查询群组列表
export type GetGroupListParameters = PageListParameters<{
  // 查询指定账号的群组列表
  account_id: string;
  // 根据标记状态过滤群组
  marked?: boolean;
}>;

// 创建群组请求
export type CreateGroupParameters = {
  // 用于创建群组的账号
  account_id: string;
  // 邀请的好友ID列表
  members: Array<string>;
  // 群组备注名
  alias?: string;
  // 群公告
  announcement?: string;
  // 群组头像
  avatar?: string;
  // 简介
  description?: string;
  // 邀请成员留言
  hello_message?: string;
  // 群组名称
  name?: string;
  // 群二维码
  qrcode?: string;
  // 备注说明
  remark?: string;
};

// 转让群组
export type TransferGroupParameters = {
  // 群组ID
  group_id: string;
  // 新群主ID
  owner_id: string;
};

// 查询群组列表结果
export type GetGroupListResponse = PageList<Group>;

// 查询会话列表请求
export type GetConversationListParameters = CursorListParameters<{
  account_id: string;
}>;

// 查询会话列表结果
export type GetConversationListResponse = CursorList<Conversation>;

export type PinConversationParameters = {
  // 会话ID
  conversation_id: string;
  // 是否置顶
  pinned: boolean;
};

// 添加好友请求
export type AddContactParameters = {
  // 账号ID
  account_id: string;
  // 联系人，可以为手机号、平台ID等
  contact: string;
  // 打招呼留言
  hello_message?: string;
};

// 添加好友结果
export type AddContactResponse = {
  // 好友申请是否发送成功
  success: boolean;
  // 如果失败，返回失败的原因
  reason?: string;
};

// 查询群成员列表请求
export type GetGroupMemberListParameters = PageListParameters<{
  group_id: string;
}>;

// 查询群成员列表结果
export type GetGroupMemberListResponse = PageList<GroupMember>;

// 邀请好友加入群组
export type InviteGroupMembersParameters = {
  // 发出邀请的账号
  account_id: string;
  // 邀请好友ID列表
  contacts: Array<string>;
  // 群组ID
  group_id: string;
  // 邀请留言
  hello_message?: string;
};

// 邀请好友加入群组结果
export type InviteGroupMembersResponse = {
  // 邀请失败的好友及原因
  failed_contacts: Array<{
    // 失败的好友ID
    contact_id: string;
    // 失败的原因
    reason?: string;
  }>;
  // 邀请是否全部发送成功
  success: boolean;
};

// 设置群成员角色
export type SetGroupMemberRoleParameters = {
  // 操作的群管理员账号
  account_id: string;
  // 群组ID
  group_id: string;
  // 群成员ID
  member_id: string;
  // 设置角色
  role: GroupMemberRole;
};

// 查询入群申请列表请求
export type GetGroupApplicationListParameters = PageListParameters<{
  group_id: string;
}>;

// 查询入群申请列表结果
export type GetGruopApplicationListResponse = PageList<GroupApplication>;

// 查询消息列表请求
export type GetMessageListParameters = CursorListParameters<{
  conversation_id: string;
}>;

// 查询消息列表结果
export type GetMessageListResponse = CursorList<Message>;

// 查询账号的动态列表请求
export type GetAccountMomentListParameters = CursorListParameters<{
  account_id: string;
}>;

// 查询好友的动态列表请求
export type GetContactMomentListParameters = CursorListParameters<{
  contact_id: string;
}>;

// 查询动态列表结果
export type GetMomentListResponse = CursorList<Moment>;

// 查询动态的评论列表
export type GetMomentCommentListParameters = CursorListParameters<{
  moment_id: string;
}>;

// 查询评论列表结果
export type GetCommentListResponse = CursorList<Comment>;

// 对动态发表评论
export type CommentOnMomentParameters = {
  // 发表评论的账号ID
  account_id: string;
  // 动态ID
  moment_id: string;
  // 评论内容
  text: string;
  // 回复的评论ID
  reply_to?: string;
};

// 消息发送目标
export type MessageTargetParameters =
  // 直接发送给对方
  | Pick<Message, 'from' | 'to'>
  // 发送到会话
  | Pick<Message, 'conversation_id'>;
