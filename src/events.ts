// cspell:disable-file
import { ClientEvent, Conversation, Message } from "./models"

export enum EventType {
  // 账号更新
  ACCOUNT_UPDATED = "uim.account:update",
  // 账号在线状态变化
  ACCOUNT_PRESENCE_CHANGED = "uim.account:presence_changed",
  // 新好友
  NEW_CONTACT = "uim.contact:new",
  // 好友更新
  CONTACT_UPDATED = "uim.contact:updated",
  // 收到好友申请
  NEW_FRIEND_APPLICATION = "uim.friend_application:new",
  // 新会话
  NEW_CONVERSATION = "uim.conversation:new",
  // 会话更新
  CONVERSATION_UPDATED = "uim.conversation:update",
  // 新消息
  NEW_MESSAGE = "uim.message:new",
  // 消息更新
  MESSAGE_UPDATED = "uim.message:update",
  // 新群组
  NEW_GROUP = "uim.group:new",
  // 群组更新
  GROUP_UPDATED = "uim.group:update",
  // 群组被解散
  GROUP_DISMISSED = "uim.group:dismiss",
  // 被踢出群组
  GROUP_KICKED = "uim.group:kick",
  // 收到入群申请
  NEW_GROUP_APPLICATION = "uim.group_application:new",
  // 收到入群邀请
  NEW_GROUP_INVITATION = "uim.group_invitation:new",
  // 新的群成员
  NEW_GROUP_MEMBER = "uim.group_member:new",
  // 群成员信息变更
  GROUP_MEMBER_UPDATED = "uim.group_member:update",
  // 群成员被踢出群
  GROUP_MEMBER_KICKED = "uim.group_member:kick",
}

export type ConversationEvent = ClientEvent<Conversation>
export type ConversationHandler = (
  accountId: string,
  e: ConversationEvent
) => void

export type MessageEvent = ClientEvent<Message>
export type MessageHandler = (accountId: string, e: MessageEvent) => void

export type Event = ConversationEvent | MessageEvent

export type EventHandler = (accountId: string, e: unknown) => void
