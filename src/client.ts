import type { Agent } from "http"
import { isNode } from "browser-or-node"
import 'unfetch/polyfill'
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
import { createQueryParams, createRandomString, pick } from "./helpers"
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
  GetConversationParameters,
  GetConversationResponse,
  getConversation,
  GetContactByUserParameters,
  getContactByUser,
} from "./api-endpoints"
import nodeFetch from "node-fetch"
import packageInfo from "../package.json"
import { SupportedFetch } from "./fetch-types"
import { SupportedPubSub, PubSubOptions, default as PubSub } from "./pubsub"
import {
  SendConversationMessageParameters,
  sendConversationMessage,
  SendPrivateMessageParameters,
  sendPrivateMessage,
  SendGroupMessageParameters,
  sendGroupMessage,
  NewMessageHandler,
  SubscribeMessage,
  SubscribeMessageType,
  SubscribeMessageHandler,
} from "./pubsub-messages"
import { IMAccount } from "./models"

export interface ClientOptions {
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

export type ClientToken = string | (() => Promise<string>)

export interface RequestParameters {
  path: string
  method: Method
  query?: QueryParams
  body?: Record<string, unknown>
  auth?: ClientToken
}

export type AuthorizeCallback = (id: string | null) => void;

interface AuthorizeResult {
  id?: string
  state?: string
  error?: string
}

const PACKAGE_VERSION = packageInfo.version
const PACKAGE_NAME = packageInfo.name

export default class Client {
  _auth?: ClientToken
  _logLevel: LogLevel
  _logger: Logger
  _prefixUrl: string
  _timeoutMs: number
  _uimVersion: string
  _fetch: SupportedFetch
  _pubsub: SupportedPubSub
  _agent: Agent | undefined
  _userAgent: string
  _handlers: Record<string, SubscribeMessageHandler>
  _messageEventListener?: (msgEvent: MessageEvent) => void

  static readonly defaultUIMVersion = "2022-02-22"

  public constructor(token: ClientToken, options?: ClientOptions) {
    this._auth = token
    this._logLevel = options?.logLevel ?? LogLevel.WARN
    this._logger = options?.logger ?? makeConsoleLogger(PACKAGE_NAME)
    this._prefixUrl = options?.baseUrl ?? "https://api.uimkit.chat/client/v1/"
    this._timeoutMs = options?.timeoutMs ?? 60_000
    this._uimVersion = options?.uimVersion ?? Client.defaultUIMVersion
    this._fetch = options?.fetch ?? (isNode ? nodeFetch : window.fetch.bind(window))
    this._agent = options?.agent
    this._userAgent = `uim-client/${PACKAGE_VERSION}`
    this._handlers = {}
    this._pubsub =
      options?.pubsub ??
      new PubSub(options?.pubsubOptions ?? defaultPubSubOptions)
    this._pubsub.addListener(this.onMessage.bind(this))
    this._messageEventListener = undefined
  }


  /**
   * Start the procedure to authorize a new im account.
   * Must in browser environment.
   */
  public async authorize(provider: string, cb?: AuthorizeCallback): Promise<string | null> {
    const state = createRandomString(16);
    const token = this._auth ? ((typeof this._auth === 'string') ? this._auth : (await this._auth())) : "";
    const params = { provider, token, state }
    const url = `${this._prefixUrl}authorize?${createQueryParams(params)}`;
    const win = this.popup(url, "uim-authorize-window");
    if (!win) {
      throw new Error('open authorize window error')
    }

    const res = await Promise.race([
      // 等待授权页面返回
      this.listenToAuthorizeResult(),
      // 检测授权页面关闭
      new Promise<null>(resolve => {
        const handle = setInterval(() => {
          if (win.closed) {
            clearInterval(handle)
            // 授权页 postMessage 后会关闭自己，这里延后让 message 先得到处理
            setTimeout(() => resolve(null), 500)
          }
        }, 500)
      })
    ])
    if (this._messageEventListener) {
      window.removeEventListener('message', this._messageEventListener)
    }
    this._messageEventListener = undefined

    if (!res) {
      // 授权页窗口被用户关闭了
      cb && cb(null);
      return null;
    }

    if (res.error) {
      throw new Error('invalid authorize state')
    }

    if (res.state !== state) {
      throw new Error('invalid authorize state')
    }

    cb && cb(res.id!)
    return res.id!
  }

  private async listenToAuthorizeResult(): Promise<AuthorizeResult> {
    const { origin } = new URL(this._prefixUrl)
    return new Promise<AuthorizeResult>((resolve) => {
      const msgEventListener = (msgEvent: MessageEvent) => {
        if (
          msgEvent.origin !== origin ||
          msgEvent.data?.type !== 'authorization_response'
        ) {
          return
        }
        window.removeEventListener('message', msgEventListener)
        this._messageEventListener = undefined
        return resolve(msgEvent.data)
      }

      this._messageEventListener = msgEventListener
      window.addEventListener('message', msgEventListener)
    })
  }

  private popup(url: string, title: string): Window | null {
    const dualScreenLeft = window.screenLeft ?? window.screenX;
    const dualScreenTop = window.screenTop ?? window.screenY;
    const windowWidth = window.innerWidth ?? document.documentElement.clientWidth ?? screen.width;
    const windowHeight = window.innerHeight ?? document.documentElement.clientHeight ?? screen.height;
    const width = Math.min(800, windowWidth / 2)
    const height = Math.min(600, windowHeight / 2)
    const left = (windowWidth - width) / 2 + dualScreenLeft
    const top = (windowHeight - height) / 2 + dualScreenTop
    return window.open(url, title,
      `scrollbars=yes, width=${width}, height=${height}, top=${top}, left=${left}`
    )
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

    const url = new URL(`${this._prefixUrl}${path}`)
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.append(key, String(value))
        }
      }
    }

    const authHeaders = await this.authAsHeaders(auth)
    const headers: Record<string, string> = {
      ...authHeaders,
      "UIM-Version": this._uimVersion,
      "user-agent": this._userAgent,
    }

    if (bodyAsJsonString !== undefined) {
      headers["content-type"] = "application/json"
    }
    try {
      const response = await RequestTimeoutError.rejectAfterTimeout(
        this._fetch(url.toString(), {
          method,
          headers,
          body: bodyAsJsonString,
          agent: this._agent,
        }),
        this._timeoutMs
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
   * @param _channel
   * @param message
   * @param _extra
   */
  private onMessage(_channel: string, message: any, _extra?: any) {
    const subscribeMessage = message as SubscribeMessage
    const messageType = subscribeMessage.type
    const handler = this._handlers[messageType]
    handler && handler(subscribeMessage)
  }

  /**
   * Add message handlers
   */
  public on(type: SubscribeMessageType, handler: SubscribeMessageHandler) {
    this._handlers[type] = handler
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
        this._pubsub.subscribe([this.channelName(resp.id)])
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
        const channels = resp.data.map(it => this.channelName(it.id))
        this._pubsub.subscribe(channels)
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

    retrieveByUser: (
      args: WithAuth<GetContactByUserParameters>
    ): Promise<GetContactResponse> => {
      return this.request<GetContactResponse>({
        path: getContactByUser.path(args),
        method: getContactByUser.method,
        query: pick(args, getContactByUser.queryParams),
        body: pick(args, getContactByUser.bodyParams),
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
      const channel = this.channelName(args.account_id)
      const message = sendPrivateMessage.toMessage(args)
      return this._pubsub.publish(channel, message)
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
      const channel = this.channelName(args.account_id)
      const message = sendGroupMessage.toMessage(args)
      return this._pubsub.publish(channel, message)
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
     * Retrieve conversation
     */
    retrieve: (
      args: WithAuth<GetConversationParameters>
    ): Promise<GetConversationResponse> => {
      return this.request<GetConversationResponse>({
        path: getConversation.path(args),
        method: getConversation.method,
        query: pick(args, getConversation.queryParams),
        body: pick(args, getConversation.bodyParams),
        auth: args?.auth,
      })
    },

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
      const channel = this.channelName(args.account_id)
      const message = sendConversationMessage.toMessage(args)
      return this._pubsub.publish(channel, message)
    },

    /**
     * Listen new messages
     *
     * @param handler
     */
    onNewMessage: (handler: NewMessageHandler): void => {
      this.on(SubscribeMessageType.NewMessage, handler)
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
    if (logLevelSeverity(level) >= logLevelSeverity(this._logLevel)) {
      this._logger(level, message, extraInfo)
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
  private async authAsHeaders(auth?: ClientToken): Promise<Record<string, string>> {
    const headers: Record<string, string> = {}
    const authHeaderValue = auth ?? this._auth
    if (authHeaderValue === undefined) return headers
    if (typeof authHeaderValue === 'string') {
      headers["authorization"] = `Bearer ${authHeaderValue}`
    } else {
      headers["authorization"] = `Bearer ${await authHeaderValue()}`
    }
    return headers
  }

  private channelName(id: string): string {
    return `account-${id}`
  }
}

/*
 * Type aliases to support the generic request interface.
 */
type Method = "get" | "post" | "patch" | "delete"
type QueryParams = Record<string, string | number> | URLSearchParams

type WithAuth<P> = P & { auth?: string }
