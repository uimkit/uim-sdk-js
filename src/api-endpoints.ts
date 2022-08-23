// cspell:disable-file

import {
  Contact,
  Conversation,
  CursorListQueryParameters,
  cursorListQueryParams,
  CursorListResponse,
  EmptyObject,
  Group,
  GroupMember,
  IMAccount,
  Message,
  Moment,
  PageListQueryParameters,
  pageListQueryParams,
  PageListResponse,
} from "./models"

type GetIMAccountPathParameters = {
  account_id: string
}

const getIMAccountPathParams = ["account_id"]

type GetIMAccountOptions = {
  subscribe?: boolean
}

export type GetIMAccountParameters = GetIMAccountPathParameters &
  GetIMAccountOptions

export type GetIMAccountResponse = IMAccount

export const getIMAccount = {
  method: "get",
  pathParams: [...getIMAccountPathParams],
  queryParams: [],
  bodyParams: [],
  path: (p: GetIMAccountPathParameters): string =>
    `im_accounts/${p.account_id}`,
} as const

type ListIMAccountsPathParameters = EmptyObject

type ListIMAccountsQueryParameters = PageListQueryParameters<EmptyObject>

type ListIMAccountsOptions = {
  subscribe?: boolean
}

export type ListIMAccountsParameters = ListIMAccountsPathParameters &
  ListIMAccountsQueryParameters &
  ListIMAccountsOptions

export type ListIMAccountsResponse = PageListResponse<IMAccount>

export const listIMAccounts = {
  method: "get",
  pathParams: [],
  queryParams: [...pageListQueryParams],
  bodyParams: [],
  path: (_: ListIMAccountsPathParameters): string => "im_accounts",
} as const

type ListContactsPathParameters = Partial<GetIMAccountPathParameters>

type ListContactsQueryParameters = CursorListQueryParameters<EmptyObject>

export type ListContactsParameters = ListContactsPathParameters &
  ListContactsQueryParameters

export type ListContactsResponse = CursorListResponse<Contact>

export const listContacts = {
  method: "get",
  pathParams: [...getIMAccountPathParams],
  queryParams: [...cursorListQueryParams],
  bodyParams: [],
  path: (p: ListContactsPathParameters): string =>
    p.account_id ? `im_accounts/${p.account_id}/contacts` : "contacts",
} as const

type ListGroupsPathParameters = Partial<GetIMAccountPathParameters>

type ListGroupsQueryParameters = PageListQueryParameters<EmptyObject>

export type ListGroupsParameters = ListGroupsPathParameters &
  ListGroupsQueryParameters

export type ListGroupsResponse = PageListResponse<Group>

export const listGroups = {
  method: "get",
  pathParams: [...getIMAccountPathParams],
  queryParams: [...pageListQueryParams],
  bodyParams: [],
  path: (p: ListGroupsPathParameters): string =>
    p.account_id ? `im_accounts/${p.account_id}/groups` : "groups",
} as const

type ListConversationsPathParameters = Partial<GetIMAccountPathParameters>

type ListConversationsQueryParameters = CursorListQueryParameters<EmptyObject>

export type ListConversationsParameters = ListConversationsPathParameters &
  ListConversationsQueryParameters

export type ListConversationsResponse = CursorListResponse<Conversation>

export const listConversations = {
  method: "get",
  pathParams: [...getIMAccountPathParams],
  queryParams: [...cursorListQueryParams],
  bodyParams: [],
  path: (p: ListConversationsPathParameters): string =>
    p.account_id
      ? `im_accounts/${p.account_id}/conversations`
      : "conversations",
} as const

type GetConversationPathParameters = {
  conversation_id: string
}

const getConversationPathParams = ["conversation_id"]

export type GetConversationParameters = GetConversationPathParameters

export type GetConversationResponse = Conversation

export const getConversation = {
  method: "get",
  pathParams: [...getConversationPathParams],
  queryParams: [],
  bodyParams: [],
  path: (p: GetConversationPathParameters): string =>
    `conversations/${p.conversation_id}`,
} as const

type GetContactPathParameters = {
  contact_id: string
}

const getContactPathParams = ["contact_id"]

export type GetContactParameters = GetContactPathParameters

export type GetContactResponse = Contact

export const getContact = {
  method: "get",
  pathParams: [...getContactPathParams],
  queryParams: [],
  bodyParams: [],
  path: (p: GetContactPathParameters): string => `contacts/${p.contact_id}`,
} as const

type GetGroupPathParameters = {
  group_id: string
}

const getGroupPathParams = ["group_id"]

export type GetGroupParameters = GetGroupPathParameters

export type GetGroupResponse = Group

export const getGroup = {
  method: "get",
  pathParams: [...getGroupPathParams],
  queryParams: [],
  bodyParams: [],
  path: (p: GetGroupPathParameters): string => `groups/${p.group_id}`,
} as const

type ListGroupMembersPathParameters = Partial<GetGroupPathParameters>

type ListGroupMembersQueryParameters = PageListQueryParameters<EmptyObject>

export type ListGroupMembersParameters = ListGroupMembersPathParameters &
  ListGroupMembersQueryParameters

export type ListGroupMembersResponse = PageListResponse<GroupMember>

export const listGroupMembers = {
  method: "get",
  pathParams: [...getGroupPathParams],
  queryParams: [...pageListQueryParams],
  bodyParams: [],
  path: (p: ListGroupMembersPathParameters): string =>
    p.group_id ? `groups/${p.group_id}/members` : "group_members",
} as const

type GetIMUserPathParameters = {
  user_id: string
}

const getIMUserPathParams = ["user_id"]

type ListMomentsPathParameters = Partial<GetIMUserPathParameters>

type ListMomentsQueryParameters = CursorListQueryParameters<EmptyObject>

export type ListMomentsParameters = ListMomentsPathParameters &
  ListMomentsQueryParameters

export type ListMomentsResponse = CursorListResponse<Moment>

export const listMoments = {
  method: "get",
  pathParams: [...getIMUserPathParams],
  queryParams: [...cursorListQueryParams],
  bodyParams: [],
  path: (p: ListMomentsPathParameters): string =>
    p.user_id ? `im_users/${p.user_id}/moments` : "moments",
} as const

type ListMessagesPathParameters = Partial<GetConversationPathParameters>

type ListMessagesQueryParameters = CursorListQueryParameters<EmptyObject>

export type ListMessagesParameters = ListMessagesPathParameters &
  ListMessagesQueryParameters

export type ListMessagesResponse = CursorListResponse<Message>

export const listMessages = {
  method: "get",
  pathParams: [...getConversationPathParams],
  queryParams: [...cursorListQueryParams],
  bodyParams: [],
  path: (p: ListMessagesPathParameters): string =>
    p.conversation_id
      ? `conversations/${p.conversation_id}/messages`
      : "messages",
} as const


export type GetContactByUserParameters = GetIMAccountPathParameters & GetIMUserPathParameters

export const getContactByUser = {
  method: "get",
  pathParams: [...getIMAccountPathParams, ...getIMUserPathParams],
  queryParams: [],
  bodyParams: [],
  path: (p: GetIMAccountPathParameters & GetIMUserPathParameters): string => `im_accounts/${p.account_id}/contacts/user/${p.user_id}`,

} as const