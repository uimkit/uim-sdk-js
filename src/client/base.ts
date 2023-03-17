import jwtdecode, { JwtPayload } from 'jwt-decode';
import EventEmitter from 'eventemitter3';
import invariant from 'invariant';
import { omit, indexOf } from 'lodash';
import { Logger, LogLevel, logLevelSeverity, makeConsoleLogger } from '../logging';
import { buildRequestError, isHTTPResponseError, isUIMClientError, RequestTimeoutError } from '../errors';
import {
  GetAccountListParameters,
  GetAccountListResponse,
  GetContactListParameters,
  GetContactListResponse,
  GetGroupListParameters,
  GetGroupListResponse,
  GetConversationListParameters,
  GetConversationListResponse,
  GetGroupMemberListParameters,
  GetGroupMemberListResponse,
  GetMomentListResponse,
  GetMessageListParameters,
  GetMessageListResponse,
  AddContactParameters,
  AddContactResponse,
  GetAccountMomentListParameters,
  GetContactMomentListParameters,
  CreateGroupParameters,
  TransferGroupParameters,
  GetFriendApplicationListParameters,
  GetFriendApplicationListResponse,
  InviteGroupMembersParameters,
  InviteGroupMembersResponse,
  SetGroupMemberRoleParameters,
  GetGroupApplicationListParameters,
  GetGruopApplicationListResponse,
  GetMomentCommentListParameters,
  GetCommentListResponse,
  CommentOnMomentParameters,
  PinConversationParameters,
} from '../api';
import { SupportedFetch } from '../fetch-types';
import { SupportedPubSub, PubSubOptions, default as PubSub } from '../pubsub';
import { EventHandler, UIMEventType, UIMEvent } from '../events';
import {
  Account,
  Contact,
  Group,
  GroupMember,
  Conversation,
  Message,
  MessageFlow,
  Comment,
  MessageStatus,
} from '../models';
import { Plugin, PluginType } from '../plugins';
import { UIMClientOptions } from './types';
import { nanoid } from 'nanoid';

/*
 * Type aliases to support the generic request interface.
 */
type Method = 'get' | 'post' | 'patch' | 'delete';

type PlainQueryParams = Record<string, string | number | boolean>;

type QueryParams = PlainQueryParams | URLSearchParams;

interface RequestParameters {
  method: Method;
  path: string;
  auth?: string;
  body?: Record<string, unknown>;
  query?: QueryParams;
}

export class BaseUIMClient {
  _uuid: string;
  _auth?: string;
  _logLevel: LogLevel;
  _logger: Logger;
  _prefixUrl: string;
  _timeoutMs: number;
  _pubsub: SupportedPubSub;
  _channels: Array<string>;
  _errorHandler?: (e: unknown) => void;
  _plugins: Partial<Record<PluginType, Plugin>>;
  _eventEmitter: EventEmitter;
  _fetch?: SupportedFetch;

  public constructor(token: string, options?: UIMClientOptions) {
    this._auth = token;
    this._logLevel = options?.logLevel ?? LogLevel.WARN;
    this._logger = makeConsoleLogger('uim-js');
    this._prefixUrl = options?.baseUrl ?? 'https://api.uimkit.chat/client/v1/';
    this._timeoutMs = options?.timeoutMs ?? 60_000;
    this._channels = [];
    this._errorHandler = options?.errorHandler;
    const jwt = jwtdecode<JwtPayload>(token);
    this._uuid = jwt.sub ?? '';
    const pubsubOptions: PubSubOptions = {
      uuid: this._uuid,
      subscribeKey: options?.subscribeKey ?? 'sub-c-ba96530f-177f-4fdb-8ab0-2e0108e0ea36',
      publishKey: options?.publishKey ?? 'pub-c-223bc64a-51a1-4588-952f-fc36b5444a28',
      secretKey: options?.secretKey ?? 'sec-c-MDAwNjM0MWItOWM3ZC00ZTExLWJjNWMtZjJkMzA3MmZmNDll',
      logVerbosity: this._logLevel === LogLevel.DEBUG,
    };
    this._pubsub = new PubSub(pubsubOptions);
    this._pubsub.addListener(this.onEvent.bind(this));
    this._eventEmitter = new EventEmitter();
    this._plugins = {};
  }

  /**
   * 发起HTTP请求调用
   *
   * @param parameters
   * @returns
   */
  public async request<T>(parameters: RequestParameters): Promise<T> {
    invariant(this._fetch, 'must setup fetch instance');
    const { path, method, query, body, auth } = parameters;
    this.log(LogLevel.INFO, 'request start', { method, path });

    // If the body is empty, don't send the body in the HTTP request
    const bodyAsJsonString = !body || Object.entries(body).length === 0 ? undefined : JSON.stringify(body);

    const url = new URL(`${this._prefixUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    const authHeaders = await this.authAsHeaders(auth);
    const headers: Record<string, string> = { ...authHeaders };
    if (bodyAsJsonString !== undefined) {
      headers['content-type'] = 'application/json';
    }

    try {
      const response = await RequestTimeoutError.rejectAfterTimeout(
        this._fetch(url.toString(), {
          method,
          headers,
          body: bodyAsJsonString,
        }),
        this._timeoutMs,
      );

      const responseText = await response.text();
      if (!response.ok) {
        throw buildRequestError(response, responseText);
      }

      if (responseText !== '') {
        const responseJson: T = JSON.parse(responseText);
        this.log(LogLevel.INFO, `request success`, { method, path });
        return responseJson;
      } else {
        return {} as T;
      }
    } catch (error: unknown) {
      if (this._errorHandler) {
        this._errorHandler(error);
      }

      if (!isUIMClientError(error)) {
        throw error;
      }

      // Log the error if it's one of our known error types
      this.log(LogLevel.WARN, `request fail`, {
        code: error.code,
        message: error.message,
      });

      if (isHTTPResponseError(error)) {
        // The response body may contain sensitive information so it is logged separately at the DEBUG level
        this.log(LogLevel.DEBUG, `failed response body`, {
          body: error.body,
        });
      }

      throw error;
    }
  }

  /**
   * 注册插件
   *
   * @param type
   * @param plugin
   */
  public registerPlugin(type: PluginType, plugin: Plugin) {
    this._plugins[type] = plugin;
  }

  /**
   * 获取插件
   *
   * @param type
   * @returns
   */
  public getPlugin(type: PluginType): Plugin | undefined {
    return this._plugins[type];
  }

  /**
   * 查询账号列表
   *
   * @param args
   * @returns
   */
  public async getAccountList(parameters: GetAccountListParameters): Promise<GetAccountListResponse> {
    const resp = await this.request<GetAccountListResponse>({
      method: 'get',
      path: 'im_accounts',
      query: parameters as PlainQueryParams,
    });
    if (resp.data.length > 0) {
      // 只需要订阅之前没有订阅过的，账号id作为channel名字
      const channels = resp.data.map((it) => it.id).filter((it) => indexOf(this._channels, it) < 0);
      this._channels = [...channels, ...this._channels];
      this._pubsub.subscribe(this._channels);
    }
    return resp;
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
      method: 'get',
    });
    if (subscribe) {
      // 注意不需要重复订阅
      const notSubscribed = indexOf(this._channels, account.id) < 0;
      if (notSubscribed) {
        this._channels = [account.id, ...this._channels];
        this._pubsub.subscribe(this._channels);
      }
    }
    return account;
  }

  /**
   * 账号退出登录
   *
   * @param {string} id 账号ID
   */
  public async logout(id: string) {
    await this.request({ path: `im_accounts/${id}/logout`, method: 'post' });
    // 取消订阅账号
    if (indexOf(this._channels, id) >= 0) {
      this._pubsub.unsubscribe([id]);
    }
  }

  /**
   * 查询好友列表
   *
   * @param parameters
   * @returns
   */
  public getContactList(parameters: GetContactListParameters): Promise<GetContactListResponse> {
    return this.request<GetContactListResponse>({
      path: `im_accounts/${parameters.account_id}/contacts`,
      method: 'get',
      query: omit(parameters, ['account_id']) as PlainQueryParams,
    });
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
      method: 'get',
    });
  }

  /**
   * 删除好友
   *
   * @param id
   */
  public async deleteContact(id: string) {
    await this.request({ path: `contacts/${id}`, method: 'delete' });
  }

  /**
   * 设置/取消星标好友
   * 
   * @param id 好友ID
   * @param marked 是否星标
   * @returns 
   */
  public async markContact(id: string, marked: boolean): Promise<Contact> {
    if (marked) {
      return await this.request<Contact>({ path: `contacts/${id}/mark`, method: 'post' });
    } else {
      return await this.request<Contact>({ path: `contacts/${id}/unmark`, method: 'post' });
    }
  }

  /**
   * 添加好友
   *
   * @param parameters
   * @returns 返回好友申请发送结果，成功仅代表好友申请发送成功
   */
  public addContact(parameters: AddContactParameters): Promise<AddContactResponse> {
    return this.request<AddContactResponse>({
      path: `im_accounts/${parameters.account_id}/contacts/add`,
      method: 'post',
      body: omit(parameters, ['account_id']),
    });
  }

  /**
   * 查询账号的好友请求列表
   *
   * @param parameters
   * @returns
   */
  public getFriendApplicationList(
    parameters: GetFriendApplicationListParameters,
  ): Promise<GetFriendApplicationListResponse> {
    return this.request<GetFriendApplicationListResponse>({
      path: `im_accounts/${parameters.account_id}/friend_applications`,
      method: 'get',
      query: omit(parameters, ['account_id']) as PlainQueryParams,
    });
  }

  /**
   * 通过好友申请
   *
   * @param {string} application_id 好友申请ID
   */
  public async acceptFriendApplication(application_id: string) {
    await this.request({
      path: `friend_applications/${application_id}/accept`,
      method: 'post',
    });
  }

  /**
   * 查询群组列表
   *
   * @param parameters
   * @returns
   */
  public getGroupList(parameters: GetGroupListParameters): Promise<GetGroupListResponse> {
    return this.request<GetGroupListResponse>({
      path: `im_accounts/${parameters.account_id}/groups`,
      method: 'get',
      query: omit(parameters, ['account_id']) as PlainQueryParams,
    });
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
      method: 'get',
    });
  }

  /**
   * 创建群组
   *
   * @param parameters
   */
  public createGroup(parameters: CreateGroupParameters): Promise<Group> {
    return this.request<Group>({
      path: `im_accounts/${parameters.account_id}/groups`,
      method: 'post',
      body: omit(parameters, ['account_id']),
    });
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
      method: 'post',
    });
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
      method: 'post',
    });
  }

  /**
   * 转让群组
   *
   * @param parameters
   */
  public async transferGroup(parameters: TransferGroupParameters) {
    await this.request({
      path: `groups/${parameters.group_id}/transfer`,
      method: 'post',
      body: omit(parameters, ['group_id']),
    });
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
      method: 'post',
    });
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
      method: 'post',
    });
  }

  /**
   * 查询群成员列表
   *
   * @param parameters
   * @returns
   */
  public getGroupMemberList(parameters: GetGroupMemberListParameters): Promise<GetGroupMemberListResponse> {
    return this.request<GetGroupMemberListResponse>({
      path: `groups/${parameters.group_id}/members`,
      method: 'get',
      query: omit(parameters, ['group_id']) as PlainQueryParams,
    });
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
      method: 'get',
    });
  }

  /**
   * 邀请好友加入群组
   *
   * @param parameters
   */
  public inviteGroupMembers(parameters: InviteGroupMembersParameters): Promise<InviteGroupMembersResponse> {
    return this.request<InviteGroupMembersResponse>({
      path: `im_accounts/${parameters.account_id}/groups/${parameters.group_id}/invite`,
      method: 'post',
      body: omit(parameters, ['account_id', 'group_id']),
    });
  }

  /**
   * 从群组踢出成员
   *
   * @param account_id
   * @param group_id
   * @param member_id
   */
  public async kickGroupMember(account_id: string, group_id: string, member_id: string) {
    await this.request<InviteGroupMembersResponse>({
      path: `im_accounts/${account_id}/groups/${group_id}/members/${member_id}/kick`,
      method: 'post',
    });
  }

  /**
   * 设置群成员角色
   *
   * @param parameters
   */
  public async setGroupMemberRole(parameters: SetGroupMemberRoleParameters) {
    await this.request({
      path: `im_accounts/${parameters.account_id}/groups/${parameters.group_id}/members/${parameters.member_id}/set_role`,
      method: 'post',
      body: { role: parameters.role },
    });
  }

  /**
   * 查询入群申请列表
   *
   * @param parameters
   * @returns
   */
  public getGroupApplicationList(
    parameters: GetGroupApplicationListParameters,
  ): Promise<GetGruopApplicationListResponse> {
    return this.request<GetGruopApplicationListResponse>({
      path: `groups/${parameters.group_id}/group_applications`,
      method: 'get',
      query: omit(parameters, ['group_id']) as PlainQueryParams,
    });
  }

  /**
   * 通过入群申请
   *
   * @param account_id
   * @param application_id
   */
  public async acceptGroupApplication(account_id: string, application_id: string) {
    await this.request({
      path: `group_applications/${application_id}/accept`,
      method: 'post',
      body: { account_id },
    });
  }

  /**
   * 查询会话列表
   *
   * @param parameters
   * @returns
   */
  public getConversationList(parameters: GetConversationListParameters): Promise<GetConversationListResponse> {
    return this.request<GetConversationListResponse>({
      path: `im_accounts/${parameters.account_id}/conversations`,
      method: 'get',
      query: omit(parameters, ['account_id']) as PlainQueryParams,
    });
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
      method: 'get',
    });
  }

  /**
   * 获取和好友的会话详情
   *
   * @param contact_id
   * @returns
   */
  public getContactConversation(contact_id: string): Promise<Conversation> {
    return this.request<Conversation>({
      path: `contacts/${contact_id}/conversations`,
      method: 'get',
    });
  }

  /**
   * 获取和群组的会话详情
   *
   * @param group_id
   * @returns
   */
  public getGroupConversation(group_id: string): Promise<Conversation> {
    return this.request<Conversation>({
      path: `groups/${group_id}/conversations`,
      method: 'get',
    });
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
      method: 'post',
      body: {},
    });
  }

  /**
   * 会话置顶
   *
   * @param parameters
   * @returns
   */
  public pinConversation(parameters: PinConversationParameters): Promise<Conversation> {
    return this.request<Conversation>({
      path: `conversations/${parameters.conversation_id}/pin`,
      method: 'post',
      body: omit(parameters, ['conversation_id']),
    });
  }

  /**
   * 删除会话
   *
   * @param id
   */
  public async deleteConversation(id: string) {
    await this.request({
      path: `conversations/${id}`,
      method: 'delete',
    });
  }

  /**
   * 查询会话的消息列表
   *
   * @param args
   * @returns
   */
  public getMessageList(parameters: GetMessageListParameters): Promise<GetMessageListResponse> {
    return this.request<GetMessageListResponse>({
      path: `conversations/${parameters.conversation_id}/messages`,
      method: 'get',
      query: omit(parameters, ['conversation_id']) as PlainQueryParams,
    });
  }

  /**
   * 重发消息
   *
   * @param message_id
   * @returns
   */
  public resendMessage(message_id: string): Promise<Message> {
    return this.request<Message>({
      path: 'resend_message',
      method: 'post',
      body: { message_id },
    });
  }

  /**
   * 删除消息
   *
   * @param id
   */
  public async deleteMessage(id: string) {
    await this.request({
      path: `messages/${id}`,
      method: 'delete',
    });
  }

  /**
   * 查询账号的动态列表
   *
   * @param parameters
   * @returns
   */
  public getAccountMomentList(parameters: GetAccountMomentListParameters): Promise<GetMomentListResponse> {
    return this.request<GetMomentListResponse>({
      path: `im_accounts/${parameters.account_id}/moments`,
      method: 'get',
      query: omit(parameters, ['account_id']) as PlainQueryParams,
    });
  }

  /**
   * 查询好友的动态列表
   *
   * @param parameters
   * @returns
   */
  public getContactMomentList(parameters: GetContactMomentListParameters): Promise<GetMomentListResponse> {
    return this.request<GetMomentListResponse>({
      path: `contacts/${parameters.contact_id}/moments`,
      method: 'get',
      query: omit(parameters, ['contact_id']) as PlainQueryParams,
    });
  }

  /**
   * 查询动态的评论列表
   *
   * @param parameters
   * @returns
   */
  public getMomentCommentList(parameters: GetMomentCommentListParameters): Promise<GetCommentListResponse> {
    return this.request<GetCommentListResponse>({
      path: `moments/${parameters.moment_id}/comments`,
      method: 'get',
      query: omit(parameters, ['moment_id']) as PlainQueryParams,
    });
  }

  /**
   * 对动态发表评论
   *
   * @param parameters
   * @returns
   */
  public commentOnMoment(parameters: CommentOnMomentParameters): Promise<Comment> {
    return this.request<Comment>({
      path: `moments/${parameters.moment_id}/comments`,
      method: 'post',
      body: omit(parameters, ['moment_id']),
    });
  }

  /**
   * 删除动态
   *
   * @param id
   */
  public async deleteMoment(id: string) {
    await this.request({
      path: `moments/${id}`,
      method: 'delete',
    });
  }

  /**
   * 监听事件
   *
   * @param type
   * @param handler
   * @returns
   */
  public on(type: UIMEventType, handler: EventHandler) {
    this._eventEmitter.on(type, handler);
  }

  /**
   * 取消监听事件
   *
   * @param type
   * @param handler
   */
  public off(type: UIMEventType, handler: EventHandler) {
    this._eventEmitter.off(type, handler);
  }

  /**
   * 监听账号的 pubnub 推送
   *
   * @param _channel
   * @param e
   * @param _extra
   */
  private onEvent(_channel: string, e: unknown, _extra?: unknown) {
    const evt = e as UIMEvent;
    this._eventEmitter.emit(evt.type, evt);
  }

  /**
   * Emits a log message to the console.
   *
   * @param level The level for this message
   * @param args Arguments to send to the console
   */
  private log(level: LogLevel, message: string, extraInfo: Record<string, unknown>) {
    if (logLevelSeverity(level) >= logLevelSeverity(this._logLevel)) {
      this._logger(level, message, extraInfo);
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
    const headers: Record<string, string> = {};
    const authHeaderValue = auth ?? this._auth;
    if (!authHeaderValue) return headers;
    headers['authorization'] = `Bearer ${authHeaderValue}`;
    return headers;
  }
}

/**
 * 为前端创建的消息填充必要的字段
 *
 * @param message
 */
export function setCreatedMessageData(message: Partial<Message>) {
  message.id = nanoid();
  message.flow = MessageFlow.Out;
  message.sent_at = new Date().getTime();
  message.status = MessageStatus.Unsent;
  message.created_at = new Date().getTime();
  message.revoked = false;
}
