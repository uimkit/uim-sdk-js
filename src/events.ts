// cspell:disable-file
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

export interface ClientEvent<T> {
  // 事件数据
  data: T;
  // 事件类型
  type: string;
  // 与事件关联的请求ID
  request_id?: string;
}

export enum EventType {
  // 账号在线状态变化
  ACCOUNT_PRESENCE_CHANGED = 'uim.account:presence_changed',
  // 账号总未读数量变化
  ACCOUNT_UNREAD_COUNT = 'uim.account:unread_count',
  // 账号更新
  ACCOUNT_UPDATED = 'uim.account:updated',
  // 好友更新
  CONTACT_UPDATED = 'uim.contact:updated',
  // 会话未读数量变化
  CONVERSATION_UNREAD_COUNT = 'uim.conversation:unread_count',
  // 会话更新
  CONVERSATION_UPDATED = 'uim.conversation:updated',
  // 群组被解散
  GROUP_DISMISSED = 'uim.group:dismissed',
  // 群成员被踢出群
  GROUP_MEMBER_KICKED = 'uim.group_member:kick',
  // 群成员主动退群
  GROUP_MEMBER_QUITED = 'uim.group_member:quited',
  // 群成员信息变更
  GROUP_MEMBER_UPDATED = 'uim.group_member:updated',
  // 离开群组
  GROUP_QUITED = 'uim.group:quited',
  // 群组更新
  GROUP_UPDATED = 'uim.group:updated',
  // 消息被撤回
  MESSAGE_REVOKED = 'uim.message:revoked',
  // 消息更新
  MESSAGE_UPDATED = 'uim.message:updated',
  // 新好友
  NEW_CONTACT = 'uim.contact:new',
  // 新会话
  NEW_CONVERSATION = 'uim.conversation:new',
  // 收到好友申请
  NEW_FRIEND_APPLICATION = 'uim.friend_application:new',
  // 新群组
  NEW_GROUP = 'uim.group:new',
  // 收到入群申请
  NEW_GROUP_APPLICATION = 'uim.group_application:new',
  // 收到入群邀请
  NEW_GROUP_INVITATION = 'uim.group_invitation:new',
  // 新的群成员
  NEW_GROUP_MEMBER = 'uim.group_member:new',
  // 收到新消息
  NEW_MESSAGE = 'uim.message:new',
}

// 账号更新
export type AccountUpdatedEvent = ClientEvent<Account>;
// 账号在线状态变化
export type AccountPresenceChangedEvent = ClientEvent<Pick<Account, 'id' | 'presence'>>;
// 账号总未读数量变化
export type AccountUnreadCountEvent = ClientEvent<Pick<Account, 'id' | 'unread'>>;
// 新好友
export type NewContactEvent = ClientEvent<Contact>;
// 好友更新
export type ContactUpdatedEvent = ClientEvent<Contact>;
// 收到好友申请
export type NewFriendApplicationEvent = ClientEvent<FriendApplication>;
// 新会话
export type NewConversationEvent = ClientEvent<Conversation>;
// 会话更新
export type ConversationUpdatedEvent = ClientEvent<Conversation>;
// 会话未读数量变化
export type ConversationUnreadCountEvent = ClientEvent<Pick<Conversation, 'id' | 'unread'>>;
// 收到新消息
export type NewMessageEvent = ClientEvent<Message>;
// 消息更新
export type MessageUpdatedEvent = ClientEvent<Message>;
// 消息被撤回
export type MessageRevokedEvent = ClientEvent<Message>;
// 新群组
export type NewGroupEvent = ClientEvent<Group>;
// 群组更新
export type GroupUpdatedEvent = ClientEvent<Group>;
// 群组被解散
export type GroupDismissedEvent = ClientEvent<Pick<Group, 'id'>>;
// 离开群组
export type GroupQuitedEvent = ClientEvent<Pick<Group, 'id'>>;
// 收到入群申请
export type NewGroupApplicationEvent = ClientEvent<GroupApplication>;
// 收到入群邀请
export type NewGroupInvitationEvent = ClientEvent<GroupInvitation>;
// 新群成员
export type NewGroupMemberEvent = ClientEvent<GroupMember>;
// 群成员更新
export type GroupMemberUpdatedEvent = ClientEvent<GroupMember>;
// 群成员被踢出群
export type GroupMemberKickedEvent = ClientEvent<Pick<GroupMember, 'id' | 'group_id' | 'nickname' | 'avatar'>>;
// 群成员主动退群
export type GroupMemberQuitedEvent = ClientEvent<Pick<GroupMember, 'id' | 'group_id' | 'nickname' | 'avatar'>>;

export type Event =
  | AccountUpdatedEvent
  | AccountPresenceChangedEvent
  | AccountUnreadCountEvent
  | NewContactEvent
  | ContactUpdatedEvent
  | NewFriendApplicationEvent
  | NewConversationEvent
  | ConversationUpdatedEvent
  | ConversationUnreadCountEvent
  | NewMessageEvent
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
