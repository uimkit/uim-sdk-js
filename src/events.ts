// cspell:disable-file
import { CloudEvent } from "cloudevents"
import { Conversation, Message } from "./models"

export enum EventType {
  // 会话信息
  NEW_CONVERSATION = "uim.conversation:new",
  // 会话更新
  CONVERSATION_UPDATED = "uim.conversation:updated",
  // 新消息
  NEW_MESSAGE = "uim.message:new",
  // 消息更新
  MESSAGE_UPDATED = "uim.message:updated",
}

export type NewConversationEvent = CloudEvent<Conversation>
export type NewConversationHandler = (
  accountId: string,
  e: NewConversationEvent
) => void

export type ConversationUpdatedEvent = CloudEvent<Conversation>
export type ConversationUpdatedHandler = (
  accountId: string,
  e: ConversationUpdatedEvent
) => void

export type NewMessageEvent = CloudEvent<Message>
export type NewMessageHandler = (
  accountId: string,
  e: NewMessageEvent
) => void

export type MessageUpdatedEvent = CloudEvent<Message>
export type MessageUpdatedHandler = (
  accountId: string,
  e: MessageUpdatedEvent
) => void

export type Event =
  | NewConversationEvent
  | ConversationUpdatedEvent
  | NewMessageEvent
  | MessageUpdatedEvent

export type EventHandler = (
  accountId: string,
  e: unknown
) => void
