import type { Agent } from "http"
import { isNode } from "browser-or-node"
import { omit, pick } from "lodash"
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
import { createQueryParams, createRandomString } from "./helpers"
import {
  ListIMAccountsParameters,
  ListIMAccountsResponse,
  ListContactsParameters,
  ListContactsResponse,
  ListGroupsParameters,
  ListGroupsResponse,
  ListConversationsParameters,
  ListConversationsResponse,
  ListGroupMembersParameters,
  ListGroupMembersResponse,
  ListMomentsParameters,
  ListMomentsResponse,
  ListMessagesParameters,
  ListMessagesResponse,
  RetrieveIMAccountParameters,
  RetrieveIMAccountResponse,
  RetrieveContactParameters,
  RetrieveContactResponse,
  RetrieveGroupParameters,
  RetrieveGroupResponse,
  RetrieveConversationParameters,
  RetrieveConversationResponse,
  SendPrivateMessageResponse,
  SendGroupMessageResponse,
  SendPrivateMessageParameters,
  SendGroupMessageParameters,
  CreateConversationParameters,
  CreateConversationResponse,
} from "./api-endpoints"
import nodeFetch from "node-fetch"
import { SupportedFetch } from "./fetch-types"
import { SupportedPubSub, PubSubOptions, default as PubSub } from "./pubsub"
import {
  ConversationUpdatedHandler,
  Event,
  EventHandler,
  EventType,
  IMAccountStatusUpdatedHandler,
  IMAccountUpdatedHandler,
  MessageReceivedEvent,
  MessageUpdatedHandler,
  NewConversationHandler,
} from "./events"
import { cursorListQueryParams, pageListQueryParams } from "./models"

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

export interface RequestParameters {
  path: string
  method: Method
  query?: QueryParams
  body?: Record<string, unknown>
  auth?: string
}

export type AuthorizeCallback = (id: string | null) => void

interface AuthorizeResult {
  id?: string
  state?: string
  error?: string
}

export default class Client {
  _auth?: string
  _logLevel: LogLevel
  _logger: Logger
  _prefixUrl: string
  _timeoutMs: number
  _fetch: SupportedFetch
  _pubsub: SupportedPubSub
  _agent: Agent | undefined
  _handlers: Record<string, EventHandler>
  _messageEventListener?: (msgEvent: MessageEvent) => void

  public constructor(token: string, options?: ClientOptions) {
    this._auth = token
    this._logLevel = options?.logLevel ?? LogLevel.WARN
    this._logger = options?.logger ?? makeConsoleLogger("uim-js")
    this._prefixUrl = options?.baseUrl ?? "https://api.uimkit.chat/client/v1/"
    this._timeoutMs = options?.timeoutMs ?? 60_000
    this._fetch =
      options?.fetch ?? (isNode ? nodeFetch : window.fetch.bind(window))
    this._agent = options?.agent
    this._handlers = {}
    this._pubsub =
      options?.pubsub ??
      new PubSub(options?.pubsubOptions ?? defaultPubSubOptions)
    this._pubsub.addListener(this.onEvent.bind(this))
    this._messageEventListener = undefined
  }

  public async authorize(
    provider: string,
    cb?: AuthorizeCallback
  ): Promise<string | null> {
    const state = createRandomString(16)
    const token = this._auth ?? ""
    const params = { provider, token, state }
    const url = `${this._prefixUrl}authorize?${createQueryParams(params)}`
    const win = this.popup(url, "uim-authorize-window")
    if (!win) {
      throw new Error("open authorize window error")
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
      }),
    ])
    if (this._messageEventListener) {
      window.removeEventListener("message", this._messageEventListener)
    }
    this._messageEventListener = undefined

    if (!res) {
      // 授权页窗口被用户关闭了
      cb && cb(null)
      return null
    }

    if (res.error) {
      throw new Error(res.error)
    }

    if (res.state !== state) {
      throw new Error("invalid authorize state")
    }

    cb && cb(res.id!)
    return res.id!
  }

  private async listenToAuthorizeResult(): Promise<AuthorizeResult> {
    const { origin } = new URL(this._prefixUrl)
    return new Promise<AuthorizeResult>(resolve => {
      const msgEventListener = (msgEvent: MessageEvent) => {
        if (
          msgEvent.origin !== origin ||
          msgEvent.data?.type !== "authorization_response"
        ) {
          return
        }
        window.removeEventListener("message", msgEventListener)
        this._messageEventListener = undefined
        return resolve(msgEvent.data)
      }

      this._messageEventListener = msgEventListener
      window.addEventListener("message", msgEventListener)
    })
  }

  private popup(url: string, title: string): Window | null {
    const dualScreenLeft = window.screenLeft ?? window.screenX
    const dualScreenTop = window.screenTop ?? window.screenY
    const windowWidth =
      window.innerWidth ?? document.documentElement.clientWidth ?? screen.width
    const windowHeight =
      window.innerHeight ??
      document.documentElement.clientHeight ??
      screen.height
    const width = Math.min(800, windowWidth / 2)
    const height = Math.min(600, windowHeight / 2)
    const left = (windowWidth - width) / 2 + dualScreenLeft
    const top = (windowHeight - height) / 2 + dualScreenTop
    return window.open(
      url,
      title,
      `scrollbars=yes, width=${width}, height=${height}, top=${top}, left=${left}`
    )
  }

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

  public on(type: EventType, handler: EventHandler): void {
    this._handlers[type] = handler
  }

  public async listIMAccounts(
    args: WithAuth<ListIMAccountsParameters>
  ): Promise<ListIMAccountsResponse> {
    const resp = await this.request<ListIMAccountsResponse>({
      method: "get",
      path: "im_accounts",
      query: pick(args, [...pageListQueryParams]) as PlainQueryParams,
      auth: args.auth,
    })
    if (args.subscribe && resp.data.length > 0) {
      const channels = resp.data.map(it => this.channelName(it.id))
      this._pubsub.subscribe(channels)
    }
    return resp
  }

  public async retrieveIMAccount(
    args: WithAuth<RetrieveIMAccountParameters>
  ): Promise<RetrieveIMAccountResponse> {
    const resp = await this.request<RetrieveIMAccountResponse>({
      path: `im_accounts/${args.account_id}`,
      method: "get",
      auth: args.auth,
    })
    if (args.subscribe) {
      this._pubsub.subscribe([this.channelName(resp.id)])
    }
    return resp
  }

  public async listContacts(
    args: WithAuth<ListContactsParameters>
  ): Promise<ListContactsResponse> {
    return this.request<ListContactsResponse>({
      path: `im_accounts/${args.account_id}/contacts`,
      method: "get",
      query: pick(args, [...cursorListQueryParams]) as PlainQueryParams,
      auth: args.auth,
    })
  }

  public async retrieveContact(
    args: WithAuth<RetrieveContactParameters>
  ): Promise<RetrieveContactResponse> {
    return this.request<RetrieveContactResponse>({
      path: `im_accounts/${args.account_id}/contacts/${args.user_id}`,
      method: "get",
      auth: args.auth,
    })
  }

  public async listGroups(
    args: WithAuth<ListGroupsParameters>
  ): Promise<ListGroupsResponse> {
    return this.request<ListGroupsResponse>({
      path: `im_accounts/${args.account_id}/groups`,
      method: "get",
      query: pick(args, [...pageListQueryParams]) as PlainQueryParams,
      auth: args.auth,
    })
  }

  public async retrieveGroup(
    args: WithAuth<RetrieveGroupParameters>
  ): Promise<RetrieveGroupResponse> {
    return this.request<RetrieveGroupResponse>({
      path: `im_accounts/${args.account_id}/groups/${args.group_id}`,
      method: "get",
      auth: args.auth,
    })
  }

  public listGroupMembers(
    args: WithAuth<ListGroupMembersParameters>
  ): Promise<ListGroupMembersResponse> {
    return this.request<ListGroupMembersResponse>({
      path: `groups/${args.group_id}/members`,
      method: "get",
      query: pick(args, [...pageListQueryParams]) as PlainQueryParams,
      auth: args.auth,
    })
  }

  public listConversations(
    args: WithAuth<ListConversationsParameters>
  ): Promise<ListConversationsResponse> {
    return this.request<ListConversationsResponse>({
      path: `im_accounts/${args.account_id}/conversations`,
      method: "get",
      query: pick(args, [...cursorListQueryParams]) as PlainQueryParams,
      auth: args.auth,
    })
  }

  public retrieveConversation(
    args: WithAuth<RetrieveConversationParameters>
  ): Promise<RetrieveConversationResponse> {
    return this.request<RetrieveConversationResponse>({
      path: `conversations/${args.conversation_id}`,
      method: "get",
      auth: args.auth,
    })
  }

  public createConversation(
    args: WithAuth<CreateConversationParameters>
  ): Promise<CreateConversationResponse> {
    return this.request<CreateConversationResponse>({
      path: "conversations",
      method: "post",
      body: omit(args, ["auth"]),
      auth: args.auth,
    })
  }

  public listMessages(
    args: WithAuth<ListMessagesParameters>
  ): Promise<ListMessagesResponse> {
    return this.request<ListMessagesResponse>({
      path: `conversations/${args.conversation_id}/messages`,
      method: "get",
      query: pick(args, [...cursorListQueryParams]) as PlainQueryParams,
      auth: args.auth,
    })
  }

  public listMoments(
    args: WithAuth<ListMomentsParameters>
  ): Promise<ListMomentsResponse> {
    return this.request<ListMomentsResponse>({
      path: args.user_id
        ? `im_accounts/${args.account_id}/contacts/${args.user_id}/moments`
        : `im_accounts/${args.account_id}/moments`,
      method: "get",
      query: pick(args, [...cursorListQueryParams]) as PlainQueryParams,
      auth: args.auth,
    })
  }

  public sendPrivateMessage(
    args: WithAuth<SendPrivateMessageParameters>
  ): Promise<SendPrivateMessageResponse> {
    return this.request<SendPrivateMessageResponse>({
      path: "send_private_message",
      method: "post",
      body: omit(args, ["auth"]),
      auth: args.auth,
    })
  }

  public sendGroupMessage(
    args: WithAuth<SendGroupMessageParameters>
  ): Promise<SendGroupMessageResponse> {
    return this.request<SendGroupMessageResponse>({
      path: "send_group_message",
      method: "post",
      body: omit(args, ["auth"]),
      auth: args.auth,
    })
  }

  onIMAccountStatusUpdated(handler: IMAccountStatusUpdatedHandler): void {
    this.on(
      EventType.IM_ACCOUNT_STATUS_UPDATED,
      handler as unknown as EventHandler
    )
  }

  onIMAccountUpdated(handler: IMAccountUpdatedHandler): void {
    this.on(EventType.IM_ACCOUNT_UPDATED, handler as unknown as EventHandler)
  }

  onNewConversation(handler: NewConversationHandler): void {
    this.on(EventType.NEW_CONVERSATION, handler as unknown as EventHandler)
  }

  onConversationUpdated(handler: ConversationUpdatedHandler): void {
    this.on(EventType.CONVERSATION_UPDATED, handler as unknown as EventHandler)
  }

  onMessageReceived(handler: MessageReceivedEvent): void {
    this.on(EventType.MESSAGE_RECEIVED, handler as unknown as EventHandler)
  }

  onMessageUpdated(handler: MessageUpdatedHandler): void {
    this.on(EventType.MESSAGE_UPDATED, handler as unknown as EventHandler)
  }

  private onEvent(_channel: string, evt: unknown, _extra?: unknown) {
    const e = evt as Event
    const handler = this._handlers[e.type]
    handler && handler(e)
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
  private async authAsHeaders(auth?: string): Promise<Record<string, string>> {
    const headers: Record<string, string> = {}
    const authHeaderValue = auth ?? this._auth
    if (!authHeaderValue) return headers
    headers["authorization"] = `Bearer ${authHeaderValue}`
    return headers
  }

  private channelName(id: string): string {
    return `uim/im-accounts/${id}`
  }
}

/*
 * Type aliases to support the generic request interface.
 */
type Method = "get" | "post" | "patch" | "delete"
type PlainQueryParams = Record<string, string | number | boolean>
type QueryParams = PlainQueryParams | URLSearchParams

type WithAuth<P> = P & { auth?: string }
