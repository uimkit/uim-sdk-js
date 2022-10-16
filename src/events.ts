// cspell:disable-file

import { Conversation, IMAccount, Message } from "./models"

export enum EventType {
  // 账号状态变更
  IM_ACCOUNT_STATUS_UPDATED = "im_account:status:updated",
  // 账号信息变更
  IM_ACCOUNT_UPDATED = "im_account:updated",
  // 新会话通知
  NEW_CONVERSATION = "conversation:created",
  // 会话信息变更
  CONVERSATION_UPDATED = "conversation:updated",
  // 收到消息
  MESSAGE_RECEIVED = "message:received",
  // 消息更新
  MESSAGE_UPDATED = "message:updated",
}

export type EventHandler = (evt: Event) => void

export type Event =
  | UnknownEvent
  | IMAccountStatusUpdatedEvent
  | IMAccountUpdatedEvent
  | NewConversationEvent
  | ConversationUpdatedEvent
  | MessageReceivedEvent
  | MessageUpdatedEvent

export type UnknownEvent = {
  type: string
  data: unknown
}

export type IMAccountStatusUpdatedEvent = {
  type: typeof EventType.IM_ACCOUNT_STATUS_UPDATED
  data: IMAccount
}

export type IMAccountStatusUpdatedHandler = (
  evt: IMAccountStatusUpdatedEvent
) => void

export type IMAccountUpdatedEvent = {
  type: typeof EventType.IM_ACCOUNT_UPDATED
  data: IMAccount
}

export type IMAccountUpdatedHandler = (evt: IMAccountUpdatedEvent) => void

export type NewConversationEvent = {
  type: typeof EventType.NEW_CONVERSATION
  data: Conversation
}

export type NewConversationHandler = (evt: NewConversationEvent) => void

export type ConversationUpdatedEvent = {
  type: typeof EventType.CONVERSATION_UPDATED
  data: Conversation
}

export type ConversationUpdatedHandler = (evt: ConversationUpdatedEvent) => void

export type MessageReceivedEvent = {
  type: typeof EventType.MESSAGE_RECEIVED
  data: Message
}

export type MessageReceivedHandler = (evt: MessageReceivedEvent) => void

export type MessageUpdatedEvent = {
  type: typeof EventType.MESSAGE_UPDATED
  data: Message
}

export type MessageUpdatedHandler = (evt: MessageUpdatedEvent) => void
