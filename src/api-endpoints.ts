// cspell:disable-file

import {
  Contact,
  Conversation,
  CursorListQueryParameters,
  CursorListResponse,
  EmptyObject,
  Group,
  GroupMember,
  IMAccount,
  MentionedType,
  Message,
  MessagePayload,
  Moment,
  PageListQueryParameters,
  PageListResponse,
} from "./models"

export type RetrieveIMAccountParameters = {
  account_id: string
  subscribe?: boolean
}

export type RetrieveIMAccountResponse = IMAccount

export type ListIMAccountsParameters = PageListQueryParameters<EmptyObject> & {
  subscribe?: boolean
}

export type ListIMAccountsResponse = PageListResponse<IMAccount>

export type ListContactsParameters = CursorListQueryParameters<EmptyObject> & {
  account_id: string
}

export type ListContactsResponse = CursorListResponse<Contact>

export type ListGroupsParameters = PageListQueryParameters<EmptyObject> & {
  account_id: string
}

export type ListGroupsResponse = PageListResponse<Group>

export type ListConversationsParameters =
  CursorListQueryParameters<EmptyObject> & {
    account_id: string
  }

export type ListConversationsResponse = CursorListResponse<Conversation>

export type RetrieveConversationParameters = {
  conversation_id: string
}

export type RetrieveConversationResponse = Conversation

export type RetrieveContactParameters = {
  account_id: string
  user_id: string
}

export type RetrieveContactResponse = Contact

export type RetrieveGroupParameters = {
  account_id: string
  group_id: string
}

export type RetrieveGroupResponse = Group

export type ListGroupMembersParameters =
  PageListQueryParameters<EmptyObject> & {
    group_id: string
  }

export type ListGroupMembersResponse = PageListResponse<GroupMember>

export type ListMomentsParameters = CursorListQueryParameters<EmptyObject> & {
  account_id: string
  user_id?: string
}

export type ListMomentsResponse = CursorListResponse<Moment>

export type ListMessagesParameters = CursorListQueryParameters<EmptyObject> & {
  conversation_id: string
}

export type ListMessagesResponse = CursorListResponse<Message>

export type SendPrivateMessageParameters = {
  account_id: string
  user_id: string
  message: MessagePayload
}

export type SendPrivateMessageResponse = Message

export type SendGroupMessageParameters = {
  account_id: string
  group_id: string
  mentioned_type?: MentionedType
  mentioned_user_ids?: string[]
  message: MessagePayload
}

export type SendGroupMessageResponse = Message
