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
  ListMomentsResponse,
  ListMessagesParameters,
  ListMessagesResponse,
  AddContactParameters,
  AddContactResponse,
  SendMessageParameters,
  ListAccountMomentsParameters,
  ListContactMomentsParameters,
  CreateGroupParameters,
  TransferGroupParameters,
  ListFriendApplicationsParameters,
  ListFriendApplicationsResponse,
  InviteGroupMembersParameters,
  InviteGroupMembersResponse,
  SetGroupMemberRoleParameters,
  ListGroupApplicationsParameters,
  ListGruopApplicationsResponse,
  CreateMessageParameters,
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
  Account,
  MessageType,
  Contact,
  Group,
  GroupMember,
  Conversation,
  Message,
  MessageFlow,
  ImageMessagePayload,
  AudioMessagePayload,
  VideoMessagePayload,
} from "./models"
import { Plugin, PluginType, UIMUploadPlugin, UploadOptions, UploadPlugin } from "./plugins"
import invariant from "invariant"

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
  _messageEventListener?: (msgEvent: MessageEvent) => void
  _errorHandler?: (e: unknown) => void
  _plugins: Partial<Record<PluginType, Plugin>>

  public constructor(token: string, options?: UIMClientOptions) {
    this._auth = token
    this._logLevel = options?.logLevel ?? LogLevel.WARN
    this._logger = makeConsoleLogger("uim-js")
    this._prefixUrl = options?.baseUrl ?? "https://api.uimkit.chat/client/v1/"
    this._timeoutMs = options?.timeoutMs ?? 60_000
    this._fetch = isNode ? nodeFetch : window.fetch.bind(window)
    this._channels = []
    this._handlers = {}
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
    // 默认的插件
    this._plugins = {
      upload: new UIMUploadPlugin(jwt.sub ?? "", token, this._prefixUrl)
    }
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
    const { path, method, query, body, auth } = parameters
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
   * 注册插件
   * 
   * @param type 
   * @param plugin 
   */
  public registerPlugin(type: PluginType, plugin: Plugin) {
    this._plugins[type] = plugin
  }

  /**
   * 获取插件
   * 
   * @param type 
   * @returns 
   */
  private getPlugin(type: PluginType): Plugin | undefined {
    return this._plugins[type]
  }

  /**
   * 查询账号列表
   *
   * @param args
   * @returns
   */
  public async listAccounts(
    parameters: ListAccountsParameters
  ): Promise<ListAccountsResponse> {
    const resp = await this.request<ListAccountsResponse>({
      method: "get",
      path: "im_accounts",
      query: pick(parameters, [
        "offset",
        "limit",
        "provider",
      ]) as PlainQueryParams,
    })
    if (parameters.subscribe && resp.data.length > 0) {
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

  /**
   * 查询好友列表
   *
   * @param parameters
   * @returns
   */
  public listContacts(
    parameters: ListContactsParameters
  ): Promise<ListContactsResponse> {
    return this.request<ListContactsResponse>({
      path: `im_accounts/${parameters.account_id}/contacts`,
      method: "get",
      query: pick(parameters, [
        "cursor",
        "direction",
        "limit",
      ]) as PlainQueryParams,
    })
  }

  /**
   * 获取好友详情
   *
   * @param {string} id 好友id
   * @returns
   */
  public getContact(id: string): Promise<Contact> {
    return this.request<Contact>({
      path: `contacts/${id}`,
      method: "get",
    })
  }

  /**
   * 删除好友
   *
   * @param id
   */
  public async deleteContact(id: string) {
    await this.request({ path: `contacts/${id}`, method: "delete" })
  }

  /**
   * 星标好友
   *
   * @param id
   */
  public async markContact(id: string) {
    await this.request({ path: `contacts/${id}/mark`, method: "post" })
  }

  /**
   * 取消星标好友
   *
   * @param id
   */
  public async unmarkContact(id: string) {
    await this.request({ path: `contacts/${id}/unmark`, method: "post" })
  }

  /**
   * 添加好友
   *
   * @param parameters
   * @returns 返回好友申请发送结果，成功仅代表好友申请发送成功
   */
  public addContact(
    parameters: AddContactParameters
  ): Promise<AddContactResponse> {
    return this.request<AddContactResponse>({
      path: `im_accounts/${parameters.account_id}/contacts/add`,
      method: "post",
      body: omit(parameters, ["account_id"]),
    })
  }

  /**
   * 查询账号的好友请求列表
   *
   * @param parameters
   * @returns
   */
  public listFriendApplications(
    parameters: ListFriendApplicationsParameters
  ): Promise<ListFriendApplicationsResponse> {
    return this.request<ListFriendApplicationsResponse>({
      path: `im_accounts/${parameters.account_id}/friend_applications`,
      method: "get",
      query: pick(parameters, ["offset", "limit"]) as PlainQueryParams,
    })
  }

  /**
   * 通过好友申请
   *
   * @param {string} application_id 好友申请ID
   */
  public async acceptFriendApplication(application_id: string) {
    await this.request({
      path: `friend_applications/${application_id}/accept`,
      method: "post",
    })
  }

  /**
   * 查询群组列表
   *
   * @param parameters
   * @returns
   */
  public listGroups(
    parameters: ListGroupsParameters
  ): Promise<ListGroupsResponse> {
    return this.request<ListGroupsResponse>({
      path: `im_accounts/${parameters.account_id}/groups`,
      method: "get",
      query: pick(parameters, ["offset", "limit"]) as PlainQueryParams,
    })
  }

  /**
   * 获取群组详情
   *
   * @param id
   * @returns
   */
  public getGroup(id: string): Promise<Group> {
    return this.request<Group>({
      path: `groups/${id}`,
      method: "get",
    })
  }

  /**
   * 创建群组
   *
   * @param parameters
   */
  public createGroup(parameters: CreateGroupParameters): Promise<Group> {
    return this.request<Group>({
      path: `im_accounts/${parameters.account_id}/groups`,
      method: "post",
      body: omit(parameters, ["account_id"]),
    })
  }

  /**
   * TODO 申请加入群组
   */

  /**
   * 退出群组
   *
   * @param account_id
   * @param group_id
   */
  public async quitGroup(account_id: string, group_id: string) {
    await this.request({
      path: `im_accounts/${account_id}/groups/${group_id}/quit`,
      method: "post",
    })
  }

  /**
   * 解散群组
   *
   * @param group_id
   * @returns
   */
  public async dismissGroup(group_id: string) {
    await this.request({
      path: `groups/${group_id}/dismiss`,
      method: "post",
    })
  }

  /**
   * 转让群组
   *
   * @param parameters
   */
  public async transferGroup(parameters: TransferGroupParameters) {
    await this.request({
      path: `groups/${parameters.group_id}/transfer`,
      method: "post",
      body: omit(parameters, ["group_id"]),
    })
  }

  /**
   * 收藏标记群组
   *
   * @param account_id
   * @param group_id
   */
  public async markGroup(account_id: string, group_id: string) {
    await this.request({
      path: `im_accounts/${account_id}/groups/${group_id}/mark`,
      method: "post",
    })
  }

  /**
   * 取消收藏标记群组
   *
   * @param account_id
   * @param group_id
   */
  public async unmarkGroup(account_id: string, group_id: string) {
    await this.request({
      path: `im_accounts/${account_id}/groups/${group_id}/unmark`,
      method: "post",
    })
  }

  /**
   * 查询群成员列表
   *
   * @param parameters
   * @returns
   */
  public listGroupMembers(
    parameters: ListGroupMembersParameters
  ): Promise<ListGroupMembersResponse> {
    return this.request<ListGroupMembersResponse>({
      path: `groups/${parameters.group_id}/members`,
      method: "get",
      query: pick(parameters, ["offset", "limit"]) as PlainQueryParams,
    })
  }

  /**
   * 获取群成员详情
   *
   * @param member_id
   * @returns
   */
  public getGroupMember(member_id: string): Promise<GroupMember> {
    return this.request<GroupMember>({
      path: `group_members/${member_id}`,
      method: "get",
    })
  }

  /**
   * 邀请好友加入群组
   *
   * @param parameters
   */
  public inviteGroupMembers(
    parameters: InviteGroupMembersParameters
  ): Promise<InviteGroupMembersResponse> {
    return this.request<InviteGroupMembersResponse>({
      path: `im_accounts/${parameters.account_id}/groups/${parameters.group_id}/invite`,
      method: "post",
      body: omit(parameters, ["account_id", "group_id"]),
    })
  }

  /**
   * 从群组踢出成员
   *
   * @param account_id
   * @param group_id
   * @param member_id
   */
  public async kickGroupMember(
    account_id: string,
    group_id: string,
    member_id: string
  ) {
    await this.request<InviteGroupMembersResponse>({
      path: `im_accounts/${account_id}/groups/${group_id}/members/${member_id}/kick`,
      method: "post",
    })
  }

  /**
   * 设置群成员角色
   *
   * @param parameters
   */
  public async setGroupMemberRole(parameters: SetGroupMemberRoleParameters) {
    await this.request({
      path: `im_accounts/${parameters.account_id}/groups/${parameters.group_id}/members/${parameters.member_id}/set_role`,
      method: "post",
      body: pick(parameters, ["role"]),
    })
  }

  /**
   * 查询入群申请列表
   *
   * @param parameters
   * @returns
   */
  public listGroupApplications(
    parameters: ListGroupApplicationsParameters
  ): Promise<ListGruopApplicationsResponse> {
    return this.request<ListGruopApplicationsResponse>({
      path: `groups/${parameters.group_id}/group_applications`,
      method: "get",
      query: pick(parameters, ["offset", "limit"]) as PlainQueryParams,
    })
  }

  /**
   * 通过入群申请
   *
   * @param account_id
   * @param application_id
   */
  public async acceptGroupApplication(
    account_id: string,
    application_id: string
  ) {
    await this.request({
      path: `group_applications/${application_id}/accept`,
      method: "post",
      body: { account_id },
    })
  }

  /**
   * 查询会话列表
   *
   * @param parameters
   * @returns
   */
  public listConversations(
    parameters: ListConversationsParameters
  ): Promise<ListConversationsResponse> {
    return this.request<ListConversationsResponse>({
      path: `im_accounts/${parameters.account_id}/conversations`,
      method: "get",
      query: pick(parameters, [
        "cursor",
        "direction",
        "limit",
      ]) as PlainQueryParams,
    })
  }

  /**
   * 获取会话详情
   *
   * @param id
   * @returns
   */
  public getConversation(id: string): Promise<Conversation> {
    return this.request<Conversation>({
      path: `conversations/${id}`,
      method: "get",
    })
  }

  /**
   * 获取和好友的会话详情
   *
   * @param account_id
   * @param contact_id
   * @returns
   */
  public getConversationWithContact(
    account_id: string,
    contact_id: string
  ): Promise<Conversation> {
    return this.request<Conversation>({
      path: `im_accounts/${account_id}/contacts/${contact_id}/conversation`,
      method: "get",
    })
  }

  /**
   * 获取和群组的会话详情
   *
   * @param account_id
   * @param group_id
   * @returns
   */
  public getConversationWithGroup(
    account_id: string,
    group_id: string
  ): Promise<Conversation> {
    return this.request<Conversation>({
      path: `im_accounts/${account_id}/groups/${group_id}/conversation`,
      method: "get",
    })
  }

  /**
   * 设置会话所有消息已读
   *
   * @param id
   * @returns
   */
  public setConversationRead(id: string): Promise<Conversation> {
    return this.request<Conversation>({
      path: `conversations/${id}/read`,
      method: "post",
      body: {},
    })
  }

  /**
   * 删除会话
   *
   * @param id
   */
  public async deleteConversation(id: string) {
    await this.request({
      path: `conversations/${id}`,
      method: "delete",
    })
  }

  /**
   * 查询会话的消息列表
   *
   * @param args
   * @returns
   */
  public listMessages(
    parameters: ListMessagesParameters
  ): Promise<ListMessagesResponse> {
    return this.request<ListMessagesResponse>({
      path: `conversations/${parameters.conversation_id}/messages`,
      method: "get",
      query: pick(parameters, [
        "cursor",
        "direction",
        "limit",
      ]) as PlainQueryParams,
    })
  }

  /**
   * 查询账号的动态列表
   *
   * @param parameters
   * @returns
   */
  public listAccountMoments(
    parameters: ListAccountMomentsParameters
  ): Promise<ListMomentsResponse> {
    return this.request<ListMomentsResponse>({
      path: `im_accounts/${parameters.account_id}/moments`,
      method: "get",
      query: pick(parameters, [
        "cursor",
        "direction",
        "limit",
      ]) as PlainQueryParams,
    })
  }

  /**
   * 查询好友的动态列表
   *
   * @param parameters
   * @returns
   */
  public listContactMoments(
    parameters: ListContactMomentsParameters
  ): Promise<ListMomentsResponse> {
    return this.request<ListMomentsResponse>({
      path: `contacts/${parameters.contact_id}/moments`,
      method: "get",
      query: pick(parameters, [
        "cursor",
        "direction",
        "limit",
      ]) as PlainQueryParams,
    })
  }

  /**
   * 发送消息
   *
   * @param parameters
   * @returns
   */
  public async sendMessage(parameters: SendMessageParameters): Promise<Message> {
    // 先上传文件
    if (parameters.file) {
      const plugin = this.getPlugin("upload")
      invariant(plugin, "must have upload plugin")

      const options: UploadOptions = {
        onProgress: parameters.upload_progress,
        message: parameters as Message
      }
      const payload = await plugin.upload(parameters.file, options)

      switch (parameters.type) {
        case MessageType.Image: {
          parameters.image = payload as ImageMessagePayload
          break
        }
        case MessageType.Audio: {
          parameters.audio = payload as AudioMessagePayload
          break
        }
        case MessageType.Video: {
          parameters.video = payload as VideoMessagePayload
          break
        }
      }
    }

    return this.request<Message>({
      path: "send_message",
      method: "post",
      body: omit(parameters, ['file', 'upload_progress']),
    })
  }

  /**
   * 重发消息
   *
   * @param message_id
   * @returns
   */
  public resendMessage(message_id: string): Promise<Message> {
    return this.request<Message>({
      path: "resend_message",
      method: "post",
      body: { message_id },
    })
  }

  /**
   * 删除消息
   *
   * @param id
   */
  public async deleteMessage(id: string) {
    await this.request({
      path: `messages/${id}`,
      method: "delete",
    })
  }

  /**
   * 创建文本消息
   *
   * @param parameters
   * @returns
   */
  public createTextMessage(parameters: CreateMessageParameters): SendMessageParameters {
    invariant(parameters.text, "must have text payload")
    const message = pick(parameters, ['from', 'to', 'conversation_type', 'conversation_id', 'text']) as Partial<Message>
    return { type: MessageType.Text, flow: MessageFlow.Out, ...message }
  }

  /**
   * 创建图片消息
   *
   * @param parameters
   * @returns
   */
  public createImageMessage(parameters: CreateMessageParameters): SendMessageParameters {
    invariant(parameters.image || parameters.file, "must have image payload or file")
    const message = pick(parameters, ['from', 'to', 'conversation_type', 'conversation_id', 'image']) as Partial<Message>
    if (message.image) {
      return { type: MessageType.Image, flow: MessageFlow.Out, ...message }
    } else {
      const { file, upload_progress } = parameters
      if (file instanceof HTMLInputElement) {
        const f = file.files?.item(0)
        invariant(f, "must have image payload or file")
        return { type: MessageType.Image, flow: MessageFlow.Out, ...message, file: f, upload_progress }
      } else {
        return { type: MessageType.Image, flow: MessageFlow.Out, ...message, file, upload_progress }
      }
    }
  }

  /**
   * 创建音频消息
   *
   * @param parameters
   * @returns
   */
  public createAudioMessage(parameters: CreateMessageParameters): SendMessageParameters {
    invariant(parameters.audio || parameters.file, "must have audio payload or file")
    const message = pick(parameters, ['from', 'to', 'conversation_type', 'conversation_id', 'audio']) as Partial<Message>
    if (message.audio) {
      return { type: MessageType.Audio, flow: MessageFlow.Out, ...message }
    } else {
      const { file, upload_progress } = parameters
      if (file instanceof HTMLInputElement) {
        const f = file.files?.item(0)
        invariant(f, "must have audio payload or file")
        return { type: MessageType.Audio, flow: MessageFlow.Out, ...message, file: f, upload_progress }
      } else {
        return { type: MessageType.Audio, flow: MessageFlow.Out, ...message, file, upload_progress }
      }
    }
  }

  /**
   * 创建视频消息
   * @param parameters
   * @returns
   */
  public createVieoMessage(parameters: CreateMessageParameters): SendMessageParameters {
    invariant(parameters.video || parameters.file, "must have video payload or file")
    const message = pick(parameters, ['from', 'to', 'conversation_type', 'conversation_id', 'video']) as Partial<Message>
    if (message.video) {
      return { type: MessageType.Video, flow: MessageFlow.Out, ...message }
    } else {
      const { file, upload_progress } = parameters
      if (file instanceof HTMLInputElement) {
        const f = file.files?.item(0)
        invariant(f, "must have video payload or file")
        return { type: MessageType.Video, flow: MessageFlow.Out, ...message, file: f, upload_progress }
      } else {
        return { type: MessageType.Video, flow: MessageFlow.Out, ...message, file, upload_progress }
      }
    }
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
    return this.on(EventType.CONVERSATION_UPDATED, (accountId, e) =>
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

  /**
   * 监听账号事件
   *
   * @param account_id
   * @param e
   * @param _extra
   */
  private onEvent(account_id: string, e: unknown, _extra?: unknown) {
    const evt = e as Event
    const handlers = this._handlers[evt.type] ?? []
    handlers.forEach(h => h(account_id, e))
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
}
