import { Contact, Conversation, CursorListQueryParameters, CursorListResponse, EmptyObject, Group, GroupMember, IMAccount, MentionedType, Message, MessagePayload, Moment, PageListQueryParameters, PageListResponse } from "./models";
export declare type RetrieveIMAccountParameters = {
    account_id: string;
    subscribe?: boolean;
};
export declare type RetrieveIMAccountResponse = IMAccount;
export declare type ListIMAccountsParameters = PageListQueryParameters<EmptyObject> & {
    subscribe?: boolean;
};
export declare type ListIMAccountsResponse = PageListResponse<IMAccount>;
export declare type ListContactsParameters = CursorListQueryParameters<EmptyObject> & {
    account_id: string;
};
export declare type ListContactsResponse = CursorListResponse<Contact>;
export declare type ListGroupsParameters = PageListQueryParameters<EmptyObject> & {
    account_id: string;
};
export declare type ListGroupsResponse = PageListResponse<Group>;
export declare type ListConversationsParameters = CursorListQueryParameters<EmptyObject> & {
    account_id: string;
};
export declare type ListConversationsResponse = CursorListResponse<Conversation>;
export declare type RetrieveConversationParameters = {
    conversation_id: string;
};
export declare type RetrieveConversationResponse = Conversation;
export declare type RetrieveContactParameters = {
    account_id: string;
    user_id: string;
};
export declare type RetrieveContactResponse = Contact;
export declare type RetrieveGroupParameters = {
    account_id: string;
    group_id: string;
};
export declare type RetrieveGroupResponse = Group;
export declare type ListGroupMembersParameters = PageListQueryParameters<EmptyObject> & {
    group_id: string;
};
export declare type ListGroupMembersResponse = PageListResponse<GroupMember>;
export declare type ListMomentsParameters = CursorListQueryParameters<EmptyObject> & {
    account_id: string;
    user_id?: string;
};
export declare type ListMomentsResponse = CursorListResponse<Moment>;
export declare type ListMessagesParameters = CursorListQueryParameters<EmptyObject> & {
    conversation_id: string;
};
export declare type ListMessagesResponse = CursorListResponse<Message>;
export declare type SendPrivateMessageParameters = {
    from: string;
    to: string;
    message: MessagePayload;
};
export declare type SendPrivateMessageResponse = Message;
export declare type SendGroupMessageParameters = {
    from: string;
    to: string;
    message: MessagePayload;
    mentioned_type?: MentionedType;
    mentioned_user_ids?: string[];
};
export declare type SendGroupMessageResponse = Message;
//# sourceMappingURL=api-endpoints.d.ts.map