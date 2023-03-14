import jwtdecode, { JwtPayload } from 'jwt-decode';
import { omit, pick, indexOf } from 'lodash';
import { nanoid } from 'nanoid';
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
  SendMessageParameters,
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
  CreateMessageParameters,
  PublishMomentParameters,
  CreateMomentParameters,
  GetMomentCommentListParameters,
  GetCommentListResponse,
  CommentOnMomentParameters,
} from '../api-endpoints';
import { SupportedFetch } from '../fetch-types';
import { SupportedPubSub, PubSubOptions, default as PubSub } from '../pubsub';
import { Event, EventHandler, EventType } from '../events';
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
  Moment,
  MomentType,
  ImageMomentContent,
  VideoMomentContent,
  Comment,
} from '../models';
import { Plugin, PluginType, UploadOptions } from '../plugins';
import invariant from 'invariant';
import { UIMClientOptions } from './types';

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
  _handlers: Record<string, Array<EventHandler>>;
  _messageEventListener?: (msgEvent: MessageEvent) => void;
  _errorHandler?: (e: unknown) => void;
  _plugins: Partial<Record<PluginType, Plugin>>;
  _fetch?: SupportedFetch;

  public constructor(token: string, options?: UIMClientOptions) {
    this._auth = token;
    this._logLevel = options?.logLevel ?? LogLevel.WARN;
    this._logger = makeConsoleLogger('uim-js');
    this._prefixUrl = options?.baseUrl ?? 'https://api.uimkit.chat/client/v1/';
    this._timeoutMs = options?.timeoutMs ?? 60_000;
    this._channels = [];
    this._handlers = {};
    this._messageEventListener = undefined;
    this._errorHandler = options?.errorHandler;
    const jwt = jwtdecode<JwtPayload>(token);
    this._uuid = jwt.sub ?? '';
    const pubsubOptions: PubSubOptions = {
      uuid: this._uuid,
      subscribeKey: options?.subscribeKey ?? '',
      publishKey: options?.publishKey,
      secretKey: options?.secretKey,
    };
    this._pubsub = new PubSub(pubsubOptions);
    this._pubsub.addListener(this.onEvent.bind(this));
    this._plugins = {};
  }

  /**
   * 发起HTTP请求调用
   *
   * @param parameters
   * @returns
   */
  private async request<T>(parameters: RequestParameters): Promise<T> {
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
  private getPlugin(type: PluginType): Plugin | undefined {
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
      query: pick(parameters, ['offset', 'limit', 'provider']) as PlainQueryParams,
    });
    if (parameters.subscribe && resp.data.length > 0) {
      // 只需要订阅之前没有订阅过的
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
   * 星标好友
   *
   * @param id
   */
  public async markContact(id: string): Promise<Contact> {
    return await this.request<Contact>({ path: `contacts/${id}/mark`, method: 'post' });
  }

  /**
   * 取消星标好友
   *
   * @param id
   */
  public async unmarkContact(id: string): Promise<Contact> {
    return await this.request<Contact>({ path: `contacts/${id}/unmark`, method: 'post' });
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
      query: pick(parameters, ['offset', 'limit']) as PlainQueryParams,
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
      query: pick(parameters, ['offset', 'limit']) as PlainQueryParams,
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
      query: pick(parameters, ['offset', 'limit']) as PlainQueryParams,
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
      body: pick(parameters, ['role']),
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
      query: pick(parameters, ['offset', 'limit']) as PlainQueryParams,
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
      query: pick(parameters, ['cursor', 'direction', 'limit']) as PlainQueryParams,
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
   * 设置会话置顶
   * 
   * @param id 
   */
  public pinConversation(id: string): Promise<Conversation> {
    return this.request<Conversation>({
      path: `conversations/${id}/pin`,
      method: 'post',
      body: {},
    });
  }

  /**
   * 取消会话置顶
   * 
   * @param id 
   */
  public unpinConversation(id: string): Promise<Conversation> {
    return this.request<Conversation>({
      path: `conversations/${id}/unpin`,
      method: 'post',
      body: {},
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
      query: pick(parameters, ['cursor', 'direction', 'limit']) as PlainQueryParams,
    });
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
      const plugin = this.getPlugin('upload');
      invariant(plugin, 'must have upload plugin');

      const options: UploadOptions = {
        onProgress: parameters.on_progress,
        message: parameters as Message,
      };
      const payload = await plugin.upload(parameters.file, options);

      switch (parameters.type) {
        case MessageType.Image: {
          parameters.image = payload as ImageMessagePayload;
          break;
        }
        case MessageType.Audio: {
          parameters.audio = payload as AudioMessagePayload;
          break;
        }
        case MessageType.Video: {
          parameters.video = payload as VideoMessagePayload;
          break;
        }
        default: {
          throw new Error('unsupported message type');
        }
      }
    }

    return this.request<Message>({
      path: 'send_message',
      method: 'post',
      body: omit(parameters, ['file', 'on_progress']),
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
   * 创建文本消息
   *
   * @param parameters
   * @returns
   */
  public createTextMessage(parameters: CreateMessageParameters): SendMessageParameters {
    invariant(parameters.text, 'must have text payload');
    const message = pick(parameters, ['from', 'to', 'conversation_id', 'text', 'mentioned_users']) as Partial<Message>;
    message.id = nanoid()
    return { type: MessageType.Text, flow: MessageFlow.Out, ...message };
  }

  /**
   * 创建图片消息
   *
   * @param parameters
   * @returns
   */
  public createImageMessage(parameters: CreateMessageParameters): SendMessageParameters {
    invariant(parameters.image || parameters.file, 'must have image payload or file');
    const message = pick(parameters, ['from', 'to', 'conversation_id', 'image']) as Partial<Message>;
    message.id = nanoid()
    if (message.image) {
      // 直接传入已经构造好的 image 参数
      return { type: MessageType.Image, flow: MessageFlow.Out, ...message };
    } else {
      // 需要上传文件
      const { file, on_progress } = parameters;
      return {
        type: MessageType.Image,
        flow: MessageFlow.Out,
        ...message,
        file,
        on_progress,
      };
    }
  }

  /**
   * 创建音频消息
   *
   * @param parameters
   * @returns
   */
  public createAudioMessage(parameters: CreateMessageParameters): SendMessageParameters {
    invariant(parameters.audio || parameters.file, 'must have audio payload or file');
    const message = pick(parameters, ['from', 'to', 'conversation_id', 'audio']) as Partial<Message>;
    message.id = nanoid()
    if (message.audio) {
      return { type: MessageType.Audio, flow: MessageFlow.Out, ...message };
    } else {
      const { file, on_progress } = parameters;
      return {
        type: MessageType.Audio,
        flow: MessageFlow.Out,
        ...message,
        file,
        on_progress,
      };
    }
  }

  /**
   * 创建视频消息
   * @param parameters
   * @returns
   */
  public createVideoMessage(parameters: CreateMessageParameters): SendMessageParameters {
    invariant(parameters.video || parameters.file, 'must have video payload or file');
    const message = pick(parameters, ['from', 'to', 'conversation_id', 'video']) as Partial<Message>;
    message.id = nanoid()
    if (message.video) {
      return { type: MessageType.Video, flow: MessageFlow.Out, ...message };
    } else {
      const { file, on_progress } = parameters;
      return {
        type: MessageType.Video,
        flow: MessageFlow.Out,
        ...message,
        file,
        on_progress,
      };
    }
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
      query: pick(parameters, ['cursor', 'direction', 'limit']) as PlainQueryParams,
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
      query: pick(parameters, ['cursor', 'direction', 'limit']) as PlainQueryParams,
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
      query: pick(parameters, ['cursor', 'direction', 'limit']) as PlainQueryParams,
    });
  }

  /**
   * 发布动态
   *
   * @param parameters
   * @returns
   */
  public async publishMoment(parameters: PublishMomentParameters): Promise<Moment> {
    // 先上传文件
    if (parameters.files && parameters.files.length > 0) {
      const plugin = this.getPlugin('upload');
      invariant(plugin, 'must have upload plugin');

      const contents = await Promise.all(
        parameters.files.map((f, idx) => {
          const options: UploadOptions = {
            onProgress: (percent) => parameters.on_progress && parameters.on_progress(idx, percent),
            moment: parameters as Moment,
          };
          return plugin.upload(f, options);
        }),
      );

      switch (parameters.type) {
        case MomentType.Image: {
          parameters.images = contents as Array<ImageMomentContent>;
          break;
        }
        case MomentType.Video: {
          parameters.video = contents[0] as VideoMomentContent;
          break;
        }
        default: {
          throw new Error('unsupported message type');
        }
      }
    }

    return this.request<Moment>({
      path: 'publish_moment',
      method: 'post',
      body: omit(parameters, ['files', 'on_progress']),
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
   * 创建文本动态
   *
   * @param parameters
   * @returns
   */
  public createTextMoment(parameters: CreateMomentParameters): PublishMomentParameters {
    invariant(parameters.text, 'must have text');
    const moment = pick(parameters, ['user_id', 'text']) as Partial<Moment>;
    return { type: MomentType.Text, ...moment };
  }

  /**
   * 创建图片动态
   *
   * @param parameters
   * @returns
   */
  public createImagesMoment(parameters: CreateMomentParameters): PublishMomentParameters {
    invariant(parameters.images || parameters.files, 'must have images or files');
    const moment = pick(parameters, ['user_id', 'images']) as Partial<Moment>;
    if (moment.images && moment.images.length > 0) {
      return { type: MomentType.Image, ...moment };
    } else {
      const { files, on_progress } = parameters;
      if (files instanceof HTMLInputElement) {
        const f: Array<File> = [];
        const len = files.files?.length ?? 0;
        for (let i = 0; i < len; i++) {
          const file = files.files?.item(i);
          if (file) f.push(file);
        }
        invariant(f && f.length > 0, 'must have images or files');
        return { type: MomentType.Image, ...moment, files: f, on_progress };
      } else {
        return { type: MomentType.Image, ...moment, files, on_progress };
      }
    }
  }

  /**
   * 创建视频动态
   *
   * @param parameters
   * @returns
   */
  public createVideoMoment(parameters: CreateMomentParameters): PublishMomentParameters {
    invariant(parameters.video || parameters.files, 'must have video or files');
    const moment = pick(parameters, ['user_id', 'video']) as Partial<Moment>;
    if (moment.video) {
      return { type: MomentType.Video, ...moment };
    } else {
      const { files, on_progress } = parameters;
      if (files instanceof HTMLInputElement) {
        const f = files.files?.item(0);
        invariant(f, 'must have video or files');
        return {
          type: MomentType.Video,
          ...moment,
          files: [f],
          on_progress,
        };
      } else {
        return { type: MomentType.Video, ...moment, files, on_progress };
      }
    }
  }

  /**
   * 监听事件
   *
   * @param type 事件类型
   * @param handler 事件处理函数
   * @returns  取消监听事件函数
   */
  public on(type: EventType, handler: EventHandler): () => void {
    this._handlers[type] = [...(this._handlers[type] ?? []), handler];
    return () => {
      const handlers = this._handlers[type] ?? [];
      const idx = handlers.findIndex((it) => it === handler);
      if (idx >= 0) {
        handlers.splice(idx, 1);
      }
      this._handlers[type] = [...handlers];
    };
  }

  /**
   * 监听账号事件
   *
   * @param account_id
   * @param e
   * @param _extra
   */
  private onEvent(account_id: string, e: unknown, _extra?: unknown) {
    const evt = e as Event;
    const handlers = this._handlers[evt.type] ?? [];
    handlers.forEach((h) => h(account_id, evt));
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
