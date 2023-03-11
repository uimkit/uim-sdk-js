// cspell_disable-file
import {
  Account,
  Contact,
  Conversation,
  FriendApplication,
  Group,
  GroupApplication,
  GroupInvitation,
  GroupMember,
  Message,
} from './models';

export interface UIMEvent<T> {
  // 事件数据
  data: T;
  // 事件类型
  type: string;
}

export enum EventType {
  // 账号在线状态变化
  ACCOUNT_PRESENCE_CHANGED = 'account_presence_changed',
  // 账号总未读数量变化
  ACCOUNT_UNREAD_COUNT = 'account_unread_count',
  // 账号更新
  ACCOUNT_UPDATED = 'account_updated',
  // 好友更新
  CONTACT_UPDATED = 'contact_updated',
  // 新会话
  CONVERSATION_CREATED = 'conversation_created',
  // 会话未读数量变化
  CONVERSATION_UNREAD_COUNT = 'conversation_unread_count',
  // 会话更新
  CONVERSATION_UPDATED = 'conversation_updated',
  // 群组被解散
  GROUP_DISMISSED = 'group_dismissed',
  // 群成员被踢出群
  GROUP_MEMBER_KICKED = 'group_member_kick',
  // 群成员主动退群
  GROUP_MEMBER_QUITED = 'group_member_quited',
  // 群成员信息变更
  GROUP_MEMBER_UPDATED = 'group_member_updated',
  // 离开群组
  GROUP_QUITED = 'group_quited',
  // 群组更新
  GROUP_UPDATED = 'group_updated',
  // 收到新消息
  MESSAGE_RECEIVED = 'message_received',
  // 消息被撤回
  MESSAGE_REVOKED = 'message_revoked',
  // 消息更新
  MESSAGE_UPDATED = 'message_updated',
  // 新好友
  NEW_CONTACT = 'contact_new',
  // 收到好友申请
  NEW_FRIEND_APPLICATION = 'friend_application_new',
  // 新群组
  NEW_GROUP = 'group_new',
  // 收到入群申请
  NEW_GROUP_APPLICATION = 'group_application_new',
  // 收到入群邀请
  NEW_GROUP_INVITATION = 'group_invitation_new',
  // 新的群成员
  NEW_GROUP_MEMBER = 'group_member_new',
}

// 账号更新
export type AccountUpdatedEvent = UIMEvent<Account>;
// 账号在线状态变化
export type AccountPresenceChangedEvent = UIMEvent<Pick<Account, 'id' | 'presence'>>;
// 账号总未读数量变化
export type AccountUnreadCountEvent = UIMEvent<Pick<Account, 'id' | 'unread'>>;
// 新好友
export type NewContactEvent = UIMEvent<Contact>;
// 好友更新
export type ContactUpdatedEvent = UIMEvent<Contact>;
// 收到好友申请
export type NewFriendApplicationEvent = UIMEvent<FriendApplication>;
// 新会话
export type ConversationCreatedEvent = UIMEvent<Conversation>;
// 会话更新
export type ConversationUpdatedEvent = UIMEvent<Conversation>;
// 会话未读数量变化
export type ConversationUnreadCountEvent = UIMEvent<Pick<Conversation, 'id' | 'unread'>>;
// 收到新消息
export type MessageReceivedEvent = UIMEvent<Message>;
// 消息更新
export type MessageUpdatedEvent = UIMEvent<Message>;
// 消息被撤回
export type MessageRevokedEvent = UIMEvent<Message>;
// 新群组
export type NewGroupEvent = UIMEvent<Group>;
// 群组更新
export type GroupUpdatedEvent = UIMEvent<Group>;
// 群组被解散
export type GroupDismissedEvent = UIMEvent<Pick<Group, 'id'>>;
// 离开群组
export type GroupQuitedEvent = UIMEvent<Pick<Group, 'id'>>;
// 收到入群申请
export type NewGroupApplicationEvent = UIMEvent<GroupApplication>;
// 收到入群邀请
export type NewGroupInvitationEvent = UIMEvent<GroupInvitation>;
// 新群成员
export type NewGroupMemberEvent = UIMEvent<GroupMember>;
// 群成员更新
export type GroupMemberUpdatedEvent = UIMEvent<GroupMember>;
// 群成员被踢出群
export type GroupMemberKickedEvent = UIMEvent<Pick<GroupMember, 'id' | 'group_id' | 'nickname' | 'avatar'>>;
// 群成员主动退群
export type GroupMemberQuitedEvent = UIMEvent<Pick<GroupMember, 'id' | 'group_id' | 'nickname' | 'avatar'>>;

export type Event =
  | AccountUpdatedEvent
  | AccountPresenceChangedEvent
  | AccountUnreadCountEvent
  | NewContactEvent
  | ContactUpdatedEvent
  | NewFriendApplicationEvent
  | ConversationCreatedEvent
  | ConversationUpdatedEvent
  | ConversationUnreadCountEvent
  | MessageReceivedEvent
  | MessageUpdatedEvent
  | MessageRevokedEvent
  | NewGroupEvent
  | GroupUpdatedEvent
  | GroupDismissedEvent
  | GroupQuitedEvent
  | NewGroupApplicationEvent
  | NewGroupMemberEvent
  | GroupMemberUpdatedEvent
  | GroupMemberKickedEvent
  | GroupMemberQuitedEvent;

export type EventHandler = (account_id: string, evt: Event) => void;
