// cspell:disable-file
import { ClientEvent, Conversation, Message } from "./models"

export enum EventType {
  // 新会话
  NEW_CONVERSATION = "uim.conversation:new",
  // 会话更新
  CONVERSAtiON_UPDATED = "uim.conversation:update",
  // 新消息 
  NEW_MESSAGE = "uim.message:new",
  // 消息更新
  MESSAGE_UPDATED = "uim.message:update"
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
