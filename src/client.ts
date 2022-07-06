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
import { pick } from "./helpers"
import {
  GetIMAccountParameters,
  GetIMAccountResponse,
  getIMAccount,
  ListIMAccountsParameters,
  ListIMAccountsResponse,
  listIMAccounts,
  ListContactsParameters,
  ListContactsResponse,
  listContacts,
  ListGroupsParameters,
  ListGroupsResponse,
  listGroups,
  ListConversationsParameters,
  ListConversationsResponse,
  listConversations,
  GetContactParameters,
  GetContactResponse,
  getContact,
  GetGroupParameters,
  GetGroupResponse,
  getGroup,
  ListGroupMembersParameters,
  ListGroupMembersResponse,
  listGroupMembers,
  ListMomentsParameters,
  ListMomentsResponse,
  listMoments,
  ListMessagesParameters,
  ListMessagesResponse,
  listMessages,
} from "./api-endpoints"
import nodeFetch from "node-fetch"
import {
  version as PACKAGE_VERSION,
  name as PACKAGE_NAME,
} from "../package.json"
import { SupportedFetch } from "./fetch-types"
import { SupportedPubSub, PubSubOptions, default as PubSub } from "./pubsub"
import { ConversationType } from "./models"
import {
  SendConversationMessageParameters,
  SendMessageEvent,
  SendPrivateMessageParameters,
  SendGroupMessageParameters,
  PublishEventType,
  SubscribeEvent,
  SubscribeEventType,
} from "./pubsub-messages"

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

const defaultPubSubOptions: PubSubOptions = {
  subscribeKey: "",
  uuid: "",
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
    this.#pubsub =
      options?.pubsub ??
      new PubSub(options?.pubsubOptions ?? defaultPubSubOptions)
    this.#pubsub.addListener(this.onMessage.bind(this))
  }

  /**
   * Sends a request.
   *
   * TODO using flyio instead of fetch
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
   * Handle messages from pubsub
   *
   * @param channel
   * @param message
   * @param _extra
   */
  private onMessage(channel: string, message: any, _extra?: any) {
    const accountId = this.idOfChannel(channel)
    const subEvent = message as SubscribeEvent
    switch (subEvent.type) {
      case SubscribeEventType.NewMessage:
        const handler = this.#handlers[subEvent.type]
        handler && handler(accountId, subEvent)
    }
  }

  public readonly events = {
    onNewMessage: (handler: EventHandler): void => {
      this.#handlers[SubscribeEventType.NewMessage] = handler
    },
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
     * List contacts
     */
    list: (
      args: WithAuth<ListContactsParameters>
    ): Promise<ListContactsResponse> => {
      return this.request<ListContactsResponse>({
        path: listContacts.path(args),
        method: listContacts.method,
        query: pick(args, listContacts.queryParams),
        body: pick(args, listContacts.bodyParams),
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
          ...pick(args, ["mentioned_type", "mentioned_user_ids", "payload"]),
        },
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
     * List groups
     */
    list: (
      args: WithAuth<ListGroupsParameters>
    ): Promise<ListGroupsResponse> => {
      return this.request<ListGroupsResponse>({
        path: listGroups.path(args),
        method: listGroups.method,
        query: pick(args, listGroups.queryParams),
        body: pick(args, listGroups.bodyParams),
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
          ...pick(args, ["mentioned_type", "mentioned_user_ids", "payload"]),
        },
      }
      return this.#pubsub.publish(channel, evt)
    },
  }

  public readonly groupMembers = {
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
  }

  public readonly conversations = {
    /**
     * List conversations
     */
    list: (
      args: WithAuth<ListConversationsParameters>
    ): Promise<ListConversationsResponse> => {
      return this.request<ListConversationsResponse>({
        path: listConversations.path(args),
        method: listConversations.method,
        query: pick(args, listConversations.queryParams),
        body: pick(args, listConversations.bodyParams),
        auth: args?.auth,
      })
    },

    /**
     * Send message to conversation
     */
    sendMessage: (args: SendConversationMessageParameters): Promise<void> => {
      const channel = this.channelOfId(args.account_id)
      const evt: SendMessageEvent = {
        type: PublishEventType.SendMessage,
        payload: pick(args, [
          "conversation_id",
          "mentioned_type",
          "mentioned_user_ids",
          "payload",
        ]),
      }
      return this.#pubsub.publish(channel, evt)
    },
  }

  public readonly messages = {
    /**
     * List conversation's message histories
     */
    list: (
      args: WithAuth<ListMessagesParameters>
    ): Promise<ListMessagesResponse> => {
      return this.request<ListMessagesResponse>({
        path: listMessages.path(args),
        method: listMessages.method,
        query: pick(args, listMessages.queryParams),
        body: pick(args, listMessages.bodyParams),
        auth: args?.auth,
      })
    },
  }

  public readonly moments = {
    /**
     * List moments
     */
    list: (
      args: WithAuth<ListMomentsParameters>
    ): Promise<ListMomentsResponse> => {
      return this.request<ListMomentsResponse>({
        path: listMoments.path(args),
        method: listMoments.method,
        query: pick(args, listMoments.queryParams),
        body: pick(args, listMoments.bodyParams),
        auth: args?.auth,
      })
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
