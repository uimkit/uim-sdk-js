import { v4 as uuidv4 } from "uuid"
import { isNode } from "browser-or-node"
import jwtdecode, { JwtPayload } from "jwt-decode"
import { omit, pick, indexOf } from "lodash"
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
import { createQueryParams, createRandomString, popup } from "./helpers"
import {
  ListAccountsParameters,
  ListAccountsResponse,
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
  RetrieveContactParameters,
  RetrieveContactResponse,
  RetrieveGroupParameters,
  RetrieveGroupResponse,
  RetrieveConversationParameters,
  RetrieveConversationResponse,
  RetrieveContactConversationParameters,
  RetrieveContactConversationResponse,
  AddContactParameters,
  AddContactResponse,
  SendMessageParameters,
  SendMessageResponse,
  ResetConversationUnreadParameters,
  ResetConversationUnreadResponse,
  RetrieveGroupConversationParameters,
  RetrieveGroupConversationResponse,
  ResendMessageParameters,
  ResendMessageResponse,
  DeleteMessageParameters,
  DeleteMessageResponse,
  SendMessageDirectParameters,
} from "./api-endpoints"
import nodeFetch from "node-fetch"
import { SupportedFetch } from "./fetch-types"
import { SupportedPubSub, PubSubOptions, default as PubSub } from "./pubsub"
import {
  ConversationEvent,
  ConversationHandler,
  Event,
  EventHandler,
  EventType,
  MessageHandler,
} from "./events"
import {
  cursorListQueryParams,
  Account,
  ConversationType,
  MessageType,
  ImageMessagePayload,
  AudioMessagePayload,
  VideoMessagePayload,
} from "./models"

/**
 * UIMClient 构造选项
 */
export interface UIMClientOptions {
  timeoutMs?: number
  baseUrl?: string
  logLevel?: LogLevel
  uimVersion?: string
  /** Options for pubsub */
  subscribeKey?: string
  publishKey?: string
  secretKey?: string
  errorHandler?: (e: unknown) => void
}

/**
 * 账号授权结果
 */
interface AuthorizeResult {
  // 账号ID
  id?: string
  // 回传的自定义参数
  state?: string
  // 错误信息
  error?: string
}

export class UIMClient {
  _auth?: string
  _logLevel: LogLevel
  _logger: Logger
  _prefixUrl: string
  _timeoutMs: number
  _fetch: SupportedFetch
  _pubsub: SupportedPubSub
  _channels: Array<string>
  _handlers: Record<string, Array<EventHandler>>
  _callbacks: Record<string, Record<string, EventHandler>>
  _callbackExpiries: Record<string, number>
  _callbackExpiryTimer: unknown
  _messageEventListener?: (msgEvent: MessageEvent) => void
  _errorHandler?: (e: unknown) => void

  public constructor(token: string, options?: UIMClientOptions) {
    this._auth = token
    this._logLevel = options?.logLevel ?? LogLevel.WARN
    this._logger = makeConsoleLogger("uim-js")
    this._prefixUrl = options?.baseUrl ?? "https://api.uimkit.chat/client/v1/"
    this._timeoutMs = options?.timeoutMs ?? 60_000
    this._fetch = isNode ? nodeFetch : window.fetch.bind(window)
    this._channels = []
    this._handlers = {}
    this._callbacks = {}
    this._callbackExpiries = {}
    this._callbackExpiryTimer = setInterval(
      this.clearExpiredCallbacks.bind(this),
      10000
    )
    this._messageEventListener = undefined
    this._errorHandler = options?.errorHandler
    const jwt = jwtdecode<JwtPayload>(token)
    const pubsubOptions: PubSubOptions = {
      uuid: jwt.sub ?? "",
      subscribeKey: options?.subscribeKey ?? "",
      publishKey: options?.publishKey,
      secretKey: options?.secretKey,
    }
    this._pubsub = new PubSub(pubsubOptions)
    this._pubsub.addListener(this.onEvent.bind(this))
  }

  /**
   * 开始授权账号流程
   *
   * @param provider
   * @param cb
   * @returns
   */
  public async authorize(
    provider: string,
    cb?: (id?: string) => void
  ): Promise<string | undefined> {
    const state = createRandomString(16)
    const token = this._auth ?? ""
    const params = { provider, token, state }
    const url = `${this._prefixUrl}authorize?${createQueryParams(params)}`
    const win = popup(url, "uim-authorize-window")
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
      cb && cb()
      return
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

  /**
   * 监听账号授权结果
   *
   * @returns
   */
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

  /**
   * 发起HTTP请求调用
   *
   * @param parameters
   * @returns
   */
  private async request<T>(parameters: RequestParameters): Promise<T> {
    const { path, method, query, body, auth, requestId } = parameters
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
    const headers: Record<string, string> = { ...authHeaders }
    headers["UIM-Request-ID"] = requestId ?? uuidv4()
    if (bodyAsJsonString !== undefined) {
      headers["content-type"] = "application/json"
    }

    try {
      const response = await RequestTimeoutError.rejectAfterTimeout(
        this._fetch(url.toString(), {
          method,
          headers,
          body: bodyAsJsonString,
        }),
        this._timeoutMs
      )

      const responseText = await response.text()
      if (!response.ok) {
        throw buildRequestError(response, responseText)
      }

      if (responseText !== "") {
        const responseJson: T = JSON.parse(responseText)
        this.log(LogLevel.INFO, `request success`, { method, path })
        return responseJson
      } else {
        return {} as T
      }
    } catch (error: unknown) {
      if (this._errorHandler) {
        this._errorHandler(error)
      }

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
   * 查询账号列表
   *
   * @param args
   * @returns
   */
  public async listAccounts(
    args: ListAccountsParameters
  ): Promise<ListAccountsResponse> {
    const resp = await this.request<ListAccountsResponse>({
      method: "get",
      path: "im_accounts",
      query: pick(args, ["offset", "limit", "provider"]) as PlainQueryParams,
    })
    if (args.subscribe && resp.data.length > 0) {
      // 只需要订阅之前没有订阅过的
      const channels = resp.data
        .map(it => it.id)
        .filter(it => indexOf(this._channels, it) < 0)
      this._channels = [...channels, ...this._channels]
      this._pubsub.subscribe(this._channels)
    }
    return resp
  }

  /**
   * 获取账号详情
   * 
   * @param {string} id 账号ID 
   * @param {boolean} subscribe 是否订阅账号的事件
   * @returns 
   */
  public async getAccount(id: string, subscribe?: boolean): Promise<Account> {
    const account = await this.request<Account>({
      path: `im_accounts/${id}`,
      method: "get",
    })
    if (subscribe) {
      // 注意不需要重复订阅
      if (indexOf(this._channels, account.id) < 0) {
        this._channels = [account.id, ...this._channels]
        this._pubsub.subscribe(this._channels)
      }
    }
    return account
  }

  /**
   * 账号退出登录
   * 
   * @param {string} id 账号ID 
   */
  public async logout(id: string) {
    await this.request({ path: `im_accounts/${id}/logout`, method: "post" })
    // 取消订阅账号
    if (indexOf(this._channels, id) >= 0) {
      this._pubsub.unsubscribe([id])
    }
  }

  public async listContacts(
    args: ListContactsParameters
  ): Promise<ListContactsResponse> {
    return this.request<ListContactsResponse>({
      path: `im_accounts/${args.account_id}/contacts`,
      method: "get",
      query: pick(args, [...cursorListQueryParams]) as PlainQueryParams,
    })
  }

  public async retrieveContact(
    args: RetrieveContactParameters
  ): Promise<RetrieveContactResponse> {
    return this.request<RetrieveContactResponse>({
      path: `im_accounts/${args.account_id}/contacts/${args.user_id}`,
      method: "get",
    })
  }

  public async addContact(
    args: AddContactParameters
  ): Promise<AddContactResponse> {
    return this.request<AddContactResponse>({
      path: `im_accounts/${args.account_id}/contacts/add`,
      method: "post",
      body: omit(args, ["auth", "account_id"]),
    })
  }

  public async listGroups(
    args: ListGroupsParameters
  ): Promise<ListGroupsResponse> {
    return this.request<ListGroupsResponse>({
      path: `im_accounts/${args.account_id}/groups`,
      method: "get",
      query: pick(args, ["offset", "limit"]) as PlainQueryParams,
    })
  }

  public async retrieveGroup(
    args: RetrieveGroupParameters
  ): Promise<RetrieveGroupResponse> {
    return this.request<RetrieveGroupResponse>({
      path: `im_accounts/${args.account_id}/groups/${args.group_id}`,
      method: "get",
    })
  }

  public listGroupMembers(
    args: ListGroupMembersParameters
  ): Promise<ListGroupMembersResponse> {
    return this.request<ListGroupMembersResponse>({
      path: `groups/${args.group_id}/members`,
      method: "get",
      query: pick(args, ["offset", "limit"]) as PlainQueryParams,
    })
  }

  public listConversations(
    args: ListConversationsParameters
  ): Promise<ListConversationsResponse> {
    return this.request<ListConversationsResponse>({
      path: `im_accounts/${args.account_id}/conversations`,
      method: "get",
      query: pick(args, [...cursorListQueryParams]) as PlainQueryParams,
    })
  }

  public retrieveConversation(
    args: RetrieveConversationParameters
  ): Promise<RetrieveConversationResponse> {
    return this.request<RetrieveConversationResponse>({
      path: `conversations/${args.conversation_id}`,
      method: "get",
    })
  }

  public retrieveContactConversation(
    args: RetrieveContactConversationParameters
  ): Promise<RetrieveContactConversationResponse> {
    return this.request<RetrieveContactConversationResponse>({
      path: `im_accounts/${args.account_id}/conversations/fetch`,
      method: "get",
      query: pick(args, ["user_id"]) as PlainQueryParams,
    })
  }

  public retrieveGroupConversation(
    args: RetrieveGroupConversationParameters
  ): Promise<RetrieveGroupConversationResponse> {
    return this.request<RetrieveGroupConversationResponse>({
      path: `im_accounts/${args.account_id}/conversations/fetch`,
      method: "get",
      query: pick(args, ["group_id"]) as PlainQueryParams,
    })
  }

  public resetConversationUnread(
    args: ResetConversationUnreadParameters
  ): Promise<ResetConversationUnreadResponse> {
    return this.request<ResetConversationUnreadResponse>({
      path: `conversations/${args.conversation_id}/reset_unread`,
      method: "post",
      body: {},
    })
  }

  public listMessages(
    args: ListMessagesParameters
  ): Promise<ListMessagesResponse> {
    return this.request<ListMessagesResponse>({
      path: `conversations/${args.conversation_id}/messages`,
      method: "get",
      query: pick(args, [...cursorListQueryParams]) as PlainQueryParams,
    })
  }

  public listMoments(
    args: ListMomentsParameters
  ): Promise<ListMomentsResponse> {
    return this.request<ListMomentsResponse>({
      path: args.user_id
        ? `im_accounts/${args.account_id}/contacts/${args.user_id}/moments`
        : `im_accounts/${args.account_id}/moments`,
      method: "get",
      query: pick(args, [...cursorListQueryParams]) as PlainQueryParams,
    })
  }

  public sendMessage(
    args: SendMessageParameters,
    handler?: MessageHandler
  ): Promise<SendMessageResponse> {
    const requestId = uuidv4()
    if (handler) {
      this.registerCallback(
        requestId,
        EventType.MESSAGE_UPDATED,
        (accountId, e) => handler(accountId, e as MessageEvent)
      )
    }
    return this.request<SendMessageResponse>({
      path: "send_message",
      method: "post",
      body: omit(args, ["auth"]),
      requestId,
    })
  }

  public resendMessage(
    args: ResendMessageParameters
  ): Promise<ResendMessageResponse> {
    return this.request<SendMessageResponse>({
      path: "resend_message",
      method: "post",
      body: omit(args, ["auth"]),
    })
  }

  public deleteMessage(
    args: DeleteMessageParameters
  ): Promise<DeleteMessageResponse> {
    return this.request<DeleteMessageResponse>({
      path: `messages/${args.message_id}`,
      method: "delete",
    })
  }

  public createTextMessage(
    from: string,
    to: string,
    conversation_type: ConversationType,
    text: string
  ): SendMessageDirectParameters {
    return { from, to, conversation_type, text, type: MessageType.Text }
  }

  public createImageMessage(
    from: string,
    to: string,
    conversation_type: ConversationType,
    image: ImageMessagePayload
  ): SendMessageDirectParameters {
    return { from, to, conversation_type, image, type: MessageType.Image }
  }

  public createAudioMessage(
    from: string,
    to: string,
    conversation_type: ConversationType,
    audio: AudioMessagePayload
  ): SendMessageDirectParameters {
    return { from, to, conversation_type, audio, type: MessageType.Audio }
  }

  public createVieoMessage(
    from: string,
    to: string,
    conversation_type: ConversationType,
    video: VideoMessagePayload
  ): SendMessageDirectParameters {
    return { from, to, conversation_type, video, type: MessageType.Video }
  }

  onNewMessage(handler: MessageHandler): () => void {
    return this.on(EventType.NEW_MESSAGE, (accountId, e) =>
      handler(accountId, e as MessageEvent)
    )
  }

  onMessageUpdated(handler: MessageHandler): () => void {
    return this.on(EventType.MESSAGE_UPDATED, (accountId, e) =>
      handler(accountId, e as MessageEvent)
    )
  }

  onNewConversation(handler: ConversationHandler): () => void {
    return this.on(EventType.NEW_CONVERSATION, (accountId, e) =>
      handler(accountId, e as ConversationEvent)
    )
  }

  onConversationUpdated(handler: ConversationHandler): () => void {
    return this.on(EventType.CONVERSAtiON_UPDATED, (accountId, e) =>
      handler(accountId, e as ConversationEvent)
    )
  }

  public on(type: EventType, handler: EventHandler): () => void {
    this._handlers[type] = [...(this._handlers[type] ?? []), handler]
    return () => {
      const handlers = this._handlers[type] ?? []
      const idx = handlers.findIndex(it => it === handler)
      if (idx >= 0) {
        handlers.splice(idx, 1)
      }
      this._handlers[type] = [...handlers]
    }
  }

  private registerCallback(
    requestId: string,
    type: string,
    handler: EventHandler
  ) {
    const callbacks = this._callbacks[requestId] ?? {}
    callbacks[type] = handler
    this._callbacks[requestId] = callbacks
    this._callbackExpiries[requestId] = new Date().getTime() + 30000
  }

  private onEvent(channel: string, e: unknown, _extra?: unknown) {
    // 队列名就是账号ID
    const accountId = channel
    const evt = e as Event
    if (evt.request_id) {
      if (this.invokeCallback(accountId, evt)) {
        return
      }
    }
    // 不是回调，作为事件处理
    const handlers = this._handlers[evt.type] ?? []
    handlers.forEach(h => h(accountId, e))
  }

  private invokeCallback(accountId: string, e: Event): boolean {
    const requestId = e.request_id!
    const callbacks = this._callbacks[requestId] ?? {}
    const handler = callbacks[e.type]
    if (handler) {
      handler(accountId, e)
      return true
    }
    return false
  }

  private clearExpiredCallbacks() {
    const now = new Date().getTime()
    Object.keys(this._callbackExpiries).forEach(requestId => {
      const expiry = this._callbackExpiries[requestId]!
      if (expiry <= now) {
        delete this._callbackExpiries[requestId]
        delete this._callbacks[requestId]
      }
    })
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
}

/*
 * Type aliases to support the generic request interface.
 */
type Method = "get" | "post" | "patch" | "delete"

type PlainQueryParams = Record<string, string | number | boolean>

type QueryParams = PlainQueryParams | URLSearchParams

interface RequestParameters {
  path: string
  method: Method
  query?: QueryParams
  body?: Record<string, unknown>
  auth?: string
  requestId?: string
}
