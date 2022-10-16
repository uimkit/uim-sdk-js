/// <reference types="node" />
import type { Agent } from "http";
import { Logger, LogLevel } from "./logging";
import { ListIMAccountsParameters, ListIMAccountsResponse, ListContactsParameters, ListContactsResponse, ListGroupsParameters, ListGroupsResponse, ListConversationsParameters, ListConversationsResponse, ListGroupMembersParameters, ListGroupMembersResponse, ListMomentsParameters, ListMomentsResponse, ListMessagesParameters, ListMessagesResponse, RetrieveIMAccountParameters, RetrieveIMAccountResponse, RetrieveContactParameters, RetrieveContactResponse, RetrieveGroupParameters, RetrieveGroupResponse, RetrieveConversationParameters, RetrieveConversationResponse, SendPrivateMessageResponse, SendGroupMessageResponse, SendPrivateMessageParameters, SendGroupMessageParameters } from "./api-endpoints";
import { SupportedFetch } from "./fetch-types";
import { SupportedPubSub, PubSubOptions } from "./pubsub";
import { ConversationUpdatedHandler, EventHandler, EventType, IMAccountStatusUpdatedHandler, IMAccountUpdatedHandler, MessageReceivedEvent, MessageUpdatedHandler, NewConversationHandler } from "./events";
export interface ClientOptions {
    timeoutMs?: number;
    baseUrl?: string;
    logLevel?: LogLevel;
    logger?: Logger;
    uimVersion?: string;
    fetch?: SupportedFetch;
    pubsub?: SupportedPubSub;
    /** Silently ignored in the browser */
    agent?: Agent;
    /** Options for pubsub */
    pubsubOptions?: PubSubOptions;
}
export interface RequestParameters {
    path: string;
    method: Method;
    query?: QueryParams;
    body?: Record<string, unknown>;
    auth?: string;
}
export declare type AuthorizeCallback = (id: string | null) => void;
export default class Client {
    _auth?: string;
    _logLevel: LogLevel;
    _logger: Logger;
    _prefixUrl: string;
    _timeoutMs: number;
    _uimVersion: string;
    _fetch: SupportedFetch;
    _pubsub: SupportedPubSub;
    _agent: Agent | undefined;
    _userAgent: string;
    _handlers: Record<string, EventHandler>;
    _messageEventListener?: (msgEvent: MessageEvent) => void;
    static readonly defaultUIMVersion = "2022-02-22";
    constructor(token: string, options?: ClientOptions);
    authorize(provider: string, cb?: AuthorizeCallback): Promise<string | null>;
    private listenToAuthorizeResult;
    private popup;
    request<ResponseBody>({ path, method, query, body, auth, }: RequestParameters): Promise<ResponseBody>;
    on(type: EventType, handler: EventHandler): void;
    listIMAccounts(args: WithAuth<ListIMAccountsParameters>): Promise<ListIMAccountsResponse>;
    retrieveIMAccount(args: WithAuth<RetrieveIMAccountParameters>): Promise<RetrieveIMAccountResponse>;
    listContacts(args: WithAuth<ListContactsParameters>): Promise<ListContactsResponse>;
    retrieveContact(args: WithAuth<RetrieveContactParameters>): Promise<RetrieveContactResponse>;
    listGroups(args: WithAuth<ListGroupsParameters>): Promise<ListGroupsResponse>;
    retrieveGroup(args: WithAuth<RetrieveGroupParameters>): Promise<RetrieveGroupResponse>;
    listGroupMembers(args: WithAuth<ListGroupMembersParameters>): Promise<ListGroupMembersResponse>;
    listConversations(args: WithAuth<ListConversationsParameters>): Promise<ListConversationsResponse>;
    retrieveConversation(args: WithAuth<RetrieveConversationParameters>): Promise<RetrieveConversationResponse>;
    listMessages(args: WithAuth<ListMessagesParameters>): Promise<ListMessagesResponse>;
    listMoments(args: WithAuth<ListMomentsParameters>): Promise<ListMomentsResponse>;
    sendPrivateMessage(args: WithAuth<SendPrivateMessageParameters>): Promise<SendPrivateMessageResponse>;
    sendGroupMessage(args: WithAuth<SendGroupMessageParameters>): Promise<SendGroupMessageResponse>;
    onIMAccountStatusUpdated(handler: IMAccountStatusUpdatedHandler): void;
    onIMAccountUpdated(handler: IMAccountUpdatedHandler): void;
    onNewConversation(handler: NewConversationHandler): void;
    onConversationUpdated(handler: ConversationUpdatedHandler): void;
    onMessageReceived(handler: MessageReceivedEvent): void;
    onMessageUpdated(handler: MessageUpdatedHandler): void;
    private onEvent;
    /**
     * Emits a log message to the console.
     *
     * @param level The level for this message
     * @param args Arguments to send to the console
     */
    private log;
    /**
     * Transforms an API key or access token into a headers object suitable for an HTTP request.
     *
     * This method uses the instance's value as the default when the input is undefined. If neither are defined, it returns
     * an empty object
     *
     * @param auth API key or access token
     * @returns headers key-value object
     */
    private authAsHeaders;
    private channelName;
}
declare type Method = "get" | "post" | "patch" | "delete";
declare type PlainQueryParams = Record<string, string | number | boolean>;
declare type QueryParams = PlainQueryParams | URLSearchParams;
declare type WithAuth<P> = P & {
    auth?: string;
};
export {};
//# sourceMappingURL=client.d.ts.map