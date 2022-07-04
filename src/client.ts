import type { Agent } from "http"
import {
  Logger,
  LogLevel,
  logLevelSeverity,
  makeConsoleLogger,
} from "./logging"
import {
  buildRequestError,
  isHTTPResponseError,
  isUIMClientError,
  RequestTimeoutError,
} from "./errors"
import { assertNever, pick } from "./helpers"
import {
  GetIMAccountParameters,
  GetIMAccountResponse,
  getIMAccount,
  ListIMAccountsParameters,
  ListIMAccountsResponse,
  listIMAccounts,
  ListIMAccountContactsParameters,
  ListIMAccountContactsResponse,
  listIMAccountContacts,
  ListIMAccountGroupsParameters,
  ListIMAccountGroupsResponse,
  listIMAccountGroups,
  ListIMAccountConversationsParameters,
  ListIMAccountConversationsResponse,
  listIMAccountConversations,
  GetContactParameters,
  GetContactResponse,
  getContact,
  GetGroupParameters,
  GetGroupResponse,
  getGroup,
  ListGroupMembersParameters,
  ListGroupMembersResponse,
  listGroupMembers,
  ListIMUserMomentsParameters,
  ListIMUserMomentsResponse,
  listIMUserMoments,
  ListConversationMessagesParameters,
  ListConversationMessagesResponse,
  listConversationMessages,
  SendConversationMessageParameters,
  SendMessageEvent,
  SendPrivateMessageParameters,
  SendGroupMessageParameters,
  PublishEventType,
  ConversationType,
  SubscribeEvent,
  SubscribeEventType,
} from "./api-endpoints"
import nodeFetch from "node-fetch"
import {
  version as PACKAGE_VERSION,
  name as PACKAGE_NAME,
} from "../package.json"
import { SupportedFetch } from "./fetch-types"
import { SupportedPubSub, PubSubOptions, default as PubSub } from "./pubsub"

export interface ClientOptions {
  auth?: string
  timeoutMs?: number
  baseUrl?: string
  logLevel?: LogLevel
  logger?: Logger
  uimVersion?: string
  fetch?: SupportedFetch
  pubsub?: SupportedPubSub
  /** Silently ignored in the browser */
  agent?: Agent
  /** Options for pubsub */
  pubsubOptions?: PubSubOptions
}

export interface RequestParameters {
  path: string
  method: Method
  query?: QueryParams
  body?: Record<string, unknown>
  auth?: string
}

export type EventHandler = (accountId: string, evt: any) => void

export default class Client {
  #auth?: string
  #logLevel: LogLevel
  #logger: Logger
  #prefixUrl: string
  #timeoutMs: number
  #uimVersion: string
  #fetch: SupportedFetch
  #pubsub: SupportedPubSub
  #agent: Agent | undefined
  #userAgent: string
  #handlers: Record<string, EventHandler>

  static readonly defaultUIMVersion = "2022-02-22"

  public constructor(options?: ClientOptions) {
    this.#auth = options?.auth
    this.#logLevel = options?.logLevel ?? LogLevel.WARN
    this.#logger = options?.logger ?? makeConsoleLogger(PACKAGE_NAME)
    this.#prefixUrl = (options?.baseUrl ?? "https://api.uimkit.chat") + "/v1/"
    this.#timeoutMs = options?.timeoutMs ?? 60_000
    this.#uimVersion = options?.uimVersion ?? Client.defaultUIMVersion
    this.#fetch = options?.fetch ?? nodeFetch
    this.#agent = options?.agent
    this.#userAgent = `uim-client/${PACKAGE_VERSION}`
    this.#handlers = {}
    this.#pubsub = options?.pubsub ?? new PubSub(options?.pubsubOptions!)
    this.#pubsub.on(this.onEvent.bind(this))
  }

  /**
   * Sends a request.
   *
   * @param path
   * @param method
   * @param query
   * @param body
   * @returns
   */
  public async request<ResponseBody>({
    path,
    method,
    query,
    body,
    auth,
  }: RequestParameters): Promise<ResponseBody> {
    this.log(LogLevel.INFO, "request start", { method, path })

    // If the body is empty, don't send the body in the HTTP request
    const bodyAsJsonString =
      !body || Object.entries(body).length === 0
        ? undefined
        : JSON.stringify(body)

    const url = new URL(`${this.#prefixUrl}${path}`)
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.append(key, String(value))
        }
      }
    }

    const headers: Record<string, string> = {
      ...this.authAsHeaders(auth),
      "UIM-Version": this.#uimVersion,
      "user-agent": this.#userAgent,
    }

    if (bodyAsJsonString !== undefined) {
      headers["content-type"] = "application/json"
    }
    try {
      const response = await RequestTimeoutError.rejectAfterTimeout(
        this.#fetch(url.toString(), {
          method,
          headers,
          body: bodyAsJsonString,
          agent: this.#agent,
        }),
        this.#timeoutMs
      )

      const responseText = await response.text()
      if (!response.ok) {
        throw buildRequestError(response, responseText)
      }

      const responseJson: ResponseBody = JSON.parse(responseText)
      this.log(LogLevel.INFO, `request success`, { method, path })
      return responseJson
    } catch (error: unknown) {
      if (!isUIMClientError(error)) {
        throw error
      }

      // Log the error if it's one of our known error types
      this.log(LogLevel.WARN, `request fail`, {
        code: error.code,
        message: error.message,
      })

      if (isHTTPResponseError(error)) {
        // The response body may contain sensitive information so it is logged separately at the DEBUG level
        this.log(LogLevel.DEBUG, `failed response body`, {
          body: error.body,
        })
      }

      throw error
    }
  }

  /**
   * Handle im account's events
   * 
   * @param channel 
   * @param evt 
   * @param extra 
   */
  private onEvent(channel: string, evt: any, _extra?: any) {
    const accountId = this.idOfChannel(channel)
    const subEvent = evt as SubscribeEvent
    switch (subEvent.type) {
      case SubscribeEventType.NewMessage:
        const handler = this.#handlers[subEvent.type]
        handler && handler(accountId, subEvent)
    }
  }

  public readonly events = {

    onNewMessage: (handler: EventHandler): void => {
      this.#handlers[SubscribeEventType.NewMessage] = handler
    }
  }

  /*
   * UIM API endpoints
   */

  public readonly imAccounts = {
    /**
     * Retrieve im account
     */
    retrieve: async (
      args: WithAuth<GetIMAccountParameters>
    ): Promise<GetIMAccountResponse> => {
      const resp = await this.request<GetIMAccountResponse>({
        path: getIMAccount.path(args),
        method: getIMAccount.method,
        query: pick(args, getIMAccount.queryParams),
        body: pick(args, getIMAccount.bodyParams),
        auth: args?.auth,
      })
      if (args.subscribe) {
        this.#pubsub.subscribe([this.channelOfId(resp.id)])
      }
      return resp
    },

    /**
     * List im accounts
     */
    list: async (
      args: WithAuth<ListIMAccountsParameters>
    ): Promise<ListIMAccountsResponse> => {
      const resp = await this.request<ListIMAccountsResponse>({
        path: listIMAccounts.path(args),
        method: listIMAccounts.method,
        query: pick(args, listIMAccounts.queryParams),
        body: pick(args, listIMAccounts.bodyParams),
        auth: args?.auth,
      })
      if (args.subscribe && resp.data.length > 0) {
        const channels = resp.data.map(it => this.channelOfId(it.id))
        this.#pubsub.subscribe(channels)
      }
      return resp
    },

    contacts: {
      /**
       * List im accounts' contacts
       */
      list: (
        args: WithAuth<ListIMAccountContactsParameters>
      ): Promise<ListIMAccountContactsResponse> => {
        return this.request<ListIMAccountContactsResponse>({
          path: listIMAccountContacts.path(args),
          method: listIMAccountContacts.method,
          query: pick(args, listIMAccountContacts.queryParams),
          body: pick(args, listIMAccountContacts.bodyParams),
          auth: args?.auth,
        })
      },
    },

    groups: {
      /**
       * List im accounts' groups
       */
      list: (
        args: WithAuth<ListIMAccountGroupsParameters>
      ): Promise<ListIMAccountGroupsResponse> => {
        return this.request<ListIMAccountGroupsResponse>({
          path: listIMAccountGroups.path(args),
          method: listIMAccountGroups.method,
          query: pick(args, listIMAccountGroups.queryParams),
          body: pick(args, listIMAccountGroups.bodyParams),
          auth: args?.auth,
        })
      },
    },

    conversations: {
      /**
       * List im accounts' conversations
       */
      list: (
        args: WithAuth<ListIMAccountConversationsParameters>
      ): Promise<ListIMAccountConversationsResponse> => {
        return this.request<ListIMAccountConversationsResponse>({
          path: listIMAccountConversations.path(args),
          method: listIMAccountConversations.method,
          query: pick(args, listIMAccountConversations.queryParams),
          body: pick(args, listIMAccountConversations.bodyParams),
          auth: args?.auth,
        })
      },
    },
  }

  public readonly imUsers = {
    moments: {
      /**
       * List im user's moments
       */
      list: (
        args: WithAuth<ListIMUserMomentsParameters>
      ): Promise<ListIMUserMomentsResponse> => {
        return this.request<ListIMUserMomentsResponse>({
          path: listIMUserMoments.path(args),
          method: listIMUserMoments.method,
          query: pick(args, listIMUserMoments.queryParams),
          body: pick(args, listIMUserMoments.bodyParams),
          auth: args?.auth,
        })
      },
    },
  }

  public readonly contacts = {
    /**
     * Retrieve contact
     */
    retrieve: (
      args: WithAuth<GetContactParameters>
    ): Promise<GetContactResponse> => {
      return this.request<GetContactResponse>({
        path: getContact.path(args),
        method: getContact.method,
        query: pick(args, getContact.queryParams),
        body: pick(args, getContact.bodyParams),
        auth: args?.auth,
      })
    },

    /**
     * Send message to contact
     */
    sendMessage: (args: SendPrivateMessageParameters): Promise<void> => {
      const channel = this.channelOfId(args.account_id)
      const evt: SendMessageEvent = {
        type: PublishEventType.SendMessage,
        payload: {
          conversation_type: ConversationType.Private,
          from: args.account_id,
          to: args.user_id,
          ...pick(args, ["mentioned_type", "mentioned_user_ids", "payload"])
        }
      }
      return this.#pubsub.publish(channel, evt)
    },
  }

  public readonly groups = {
    /**
     * Retrieve group
     */
    retrieve: (
      args: WithAuth<GetGroupParameters>
    ): Promise<GetGroupResponse> => {
      return this.request<GetGroupResponse>({
        path: getGroup.path(args),
        method: getGroup.method,
        query: pick(args, getGroup.queryParams),
        body: pick(args, getGroup.bodyParams),
        auth: args?.auth,
      })
    },

    /**
     * Send message to group
     */
    sendMessage: (args: SendGroupMessageParameters): Promise<void> => {
      const channel = this.channelOfId(args.account_id)
      const evt: SendMessageEvent = {
        type: PublishEventType.SendMessage,
        payload: {
          conversation_type: ConversationType.Group,
          from: args.account_id,
          to: args.group_id,
          ...pick(args, ["mentioned_type", "mentioned_user_ids", "payload"])
        }
      }
      return this.#pubsub.publish(channel, evt)
    },

    members: {
      /**
       * List group's members
       */
      list: (
        args: WithAuth<ListGroupMembersParameters>
      ): Promise<ListGroupMembersResponse> => {
        return this.request<ListGroupMembersResponse>({
          path: listGroupMembers.path(args),
          method: listGroupMembers.method,
          query: pick(args, listGroupMembers.queryParams),
          body: pick(args, listGroupMembers.bodyParams),
          auth: args?.auth,
        })
      },
    },
  }

  public readonly conversations = {

    /**
     * Send message to conversation 
     */
    sendMessage: (args: SendConversationMessageParameters): Promise<void> => {
      const channel = this.channelOfId(args.account_id)
      const evt: SendMessageEvent = {
        type: PublishEventType.SendMessage,
        payload: pick(args, ["conversation_id", "mentioned_type", "mentioned_user_ids", "payload"])
      }
      return this.#pubsub.publish(channel, evt)
    },

    messages: {
      /**
       * List conversation's message histories
       */
      list: (
        args: WithAuth<ListConversationMessagesParameters>
      ): Promise<ListConversationMessagesResponse> => {
        return this.request<ListConversationMessagesResponse>({
          path: listConversationMessages.path(args),
          method: listConversationMessages.method,
          query: pick(args, listConversationMessages.queryParams),
          body: pick(args, listConversationMessages.bodyParams),
          auth: args?.auth,
        })
      },
    },
  }

  /**
   * Emits a log message to the console.
   *
   * @param level The level for this message
   * @param args Arguments to send to the console
   */
  private log(
    level: LogLevel,
    message: string,
    extraInfo: Record<string, unknown>
  ) {
    if (logLevelSeverity(level) >= logLevelSeverity(this.#logLevel)) {
      this.#logger(level, message, extraInfo)
    }
  }

  /**
   * Transforms an API key or access token into a headers object suitable for an HTTP request.
   *
   * This method uses the instance's value as the default when the input is undefined. If neither are defined, it returns
   * an empty object
   *
   * @param auth API key or access token
   * @returns headers key-value object
   */
  private authAsHeaders(auth?: string): Record<string, string> {
    const headers: Record<string, string> = {}
    const authHeaderValue = auth ?? this.#auth
    if (authHeaderValue !== undefined) {
      headers["authorization"] = `Bearer ${authHeaderValue}`
    }
    return headers
  }

  private channelOfId(id: string): string {
    return `account-${id}`
  }

  private idOfChannel(channel: string): string {
    return channel.split("-")[1] ?? ""
  }
}

/*
 * Type aliases to support the generic request interface.
 */
type Method = "get" | "post" | "patch" | "delete"
type QueryParams = Record<string, string | number> | URLSearchParams

type WithAuth<P> = P & { auth?: string }
