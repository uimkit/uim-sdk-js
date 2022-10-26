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
  provider: string,
  userid: string,
  e: NewConversationEvent
) => void
export type ConversationUpdatedEvent = CloudEvent<Conversation>
export type ConversationUpdatedHandler = (
  provider: string,
  userid: string,
  e: ConversationUpdatedEvent
) => void
export type NewMessageEvent = CloudEvent<Message>
export type NewMessageHandler = (
  provider: string,
  userid: string,
  e: NewMessageEvent
) => void
export type MessageUpdatedEvent = CloudEvent<Message>
export type MessageUpdatedHandler = (
  provider: string,
  userid: string,
  e: MessageUpdatedEvent
) => void

export type Event =
  | NewConversationEvent
  | ConversationUpdatedEvent
  | NewMessageEvent
  | MessageUpdatedEvent

export type EventHandler = (
  provider: string,
  userid: string,
  e: unknown
) => void
