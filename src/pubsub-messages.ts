// cspell:disable-file

import {
  ConversationType,
  MentionedType,
  Message,
  MessagePayload,
} from "./models"

export enum PublishMessageType {
  SendMessage = "send_message",
}

export enum SubscribeMessageType {
  NewMessage = "new_message",
}

export type PublishMessage = SendMessage

export type SubscribeMessage = NewMessage

export type SendMessage = {
  type: "send_message"
  payload: {
    conversation_id?: string
    conversation_type?: ConversationType
    from?: string
    to?: string
    mentioned_type?: MentionedType
    mentioned_user_ids?: Array<string>
    payload: MessagePayload
  }
}

export type NewMessage = {
  type: "new_message"
  payload: Message
}

export type SubscribeMessageHandler = (message: SubscribeMessage) => void

export type NewMessageHandler = (message: NewMessage) => void

export type SendConversationMessageParameters = {
  account_id: string
  conversation_id: string
  mentioned_type?: MentionedType
  mentioned_user_ids?: Array<string>
  payload: MessagePayload
}

export const sendConversationMessage = {
  toMessage: (p: SendConversationMessageParameters): PublishMessage => {
    return {
      type: PublishMessageType.SendMessage,
      payload: {
        conversation_id: p.conversation_id,
        mentioned_type: p.mentioned_type,
        mentioned_user_ids: p.mentioned_user_ids,
        payload: p.payload,
      },
    } as SendMessage
  },
} as const

export type SendGroupMessageParameters = {
  account_id: string
  group_id: string
  mentioned_type?: MentionedType
  mentioned_user_ids?: Array<string>
  payload: MessagePayload
}

export const sendGroupMessage = {
  toMessage: (p: SendGroupMessageParameters): PublishMessage => {
    return {
      type: PublishMessageType.SendMessage,
      payload: {
        conversation_type: ConversationType.Group,
        from: p.account_id,
        to: p.group_id,
        mentioned_type: p.mentioned_type,
        mentioned_user_ids: p.mentioned_user_ids,
        payload: p.payload,
      },
    } as SendMessage
  },
} as const

export type SendPrivateMessageParameters = {
  account_id: string
  user_id: string
  payload: MessagePayload
}

export const sendPrivateMessage = {
  toMessage: (p: SendPrivateMessageParameters): PublishMessage => {
    return {
      type: PublishMessageType.SendMessage,
      payload: {
        conversation_type: ConversationType.Private,
        from: p.account_id,
        to: p.user_id,
        payload: p.payload,
      },
    } as SendMessage
  },
} as const
