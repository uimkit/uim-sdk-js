import {
  ConversationType,
  ImageMessagePayload,
  MentionedType,
  Message,
  TextMessagePayload,
  VideoMessagePayload,
  VoiceMessagePayload,
} from "./models"

type SendMessageParameters = {
  mentioned_type?: MentionedType
  mentioned_user_ids?: Array<string>
  payload:
    | TextMessagePayload
    | ImageMessagePayload
    | VoiceMessagePayload
    | VideoMessagePayload
}

export type SendConversationMessageParameters = SendMessageParameters & {
  account_id: string
  conversation_id: string
}

export type SendGroupMessageParameters = SendMessageParameters & {
  account_id: string
  group_id: string
}

export type SendPrivateMessageParameters = SendMessageParameters & {
  account_id: string
  user_id: string
}

export enum PublishEventType {
  SendMessage = "send_message",
}

export type PublishEvent = SendMessageEvent

export type SendMessageEvent = {
  type: "send_message"
  payload: SendMessageParameters & {
    conversation_id?: string
    conversation_type?: ConversationType
    from?: string
    to?: string
  }
}

export enum SubscribeEventType {
  NewMessage = "new_message",
}

export type SubscribeEvent = NewMessageEvent

export type NewMessageEvent = {
  type: "new_message"
  payload: Message
}
