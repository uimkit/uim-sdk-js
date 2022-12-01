// cspell:disable-file
import { ClientEvent, Conversation, Message } from "./models"

export enum EventType {
  // 推送会话
  CONVERSATION = "uim.conversation",
  // 推送消息
  MESSAGE = "uim.message",
}

export type ConversationEvent = ClientEvent<Conversation>
export type ConversationHandler = (
  accountId: string,
  e: ConversationEvent
) => void

export type MessageEvent = ClientEvent<Message>
export type MessageHandler = (
  accountId: string,
  e: MessageEvent
) => void

export type Event =
  | ConversationEvent
  | MessageEvent

export type EventHandler = (
  accountId: string,
  e: unknown
) => void
