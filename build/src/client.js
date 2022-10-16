import { isNode } from "browser-or-node";
import { omit, pick } from "lodash";
import { LogLevel, logLevelSeverity, makeConsoleLogger, } from "./logging";
import { buildRequestError, isHTTPResponseError, isUIMClientError, RequestTimeoutError, } from "./errors";
import { createQueryParams, createRandomString } from "./helpers";
import nodeFetch from "node-fetch";
import packageInfo from "../package.json";
import { default as PubSub } from "./pubsub";
import { EventType, } from "./events";
import { cursorListQueryParams, pageListQueryParams } from "./models";
const defaultPubSubOptions = {
    subscribeKey: "",
    uuid: "",
};
const PACKAGE_VERSION = packageInfo.version;
const PACKAGE_NAME = packageInfo.name;
export default class Client {
    _auth;
    _logLevel;
    _logger;
    _prefixUrl;
    _timeoutMs;
    _uimVersion;
    _fetch;
    _pubsub;
    _agent;
    _userAgent;
    _handlers;
    _messageEventListener;
    static defaultUIMVersion = "2022-02-22";
    constructor(token, options) {
        this._auth = token;
        this._logLevel = options?.logLevel ?? LogLevel.WARN;
        this._logger = options?.logger ?? makeConsoleLogger(PACKAGE_NAME);
        this._prefixUrl = options?.baseUrl ?? "https://api.uimkit.chat/client/v1/";
        this._timeoutMs = options?.timeoutMs ?? 60_000;
        this._uimVersion = options?.uimVersion ?? Client.defaultUIMVersion;
        this._fetch =
            options?.fetch ?? (isNode ? nodeFetch : window.fetch.bind(window));
        this._agent = options?.agent;
        this._userAgent = `uim-client/${PACKAGE_VERSION}`;
        this._handlers = {};
        this._pubsub =
            options?.pubsub ??
                new PubSub(options?.pubsubOptions ?? defaultPubSubOptions);
        this._pubsub.addListener(this.onEvent.bind(this));
        this._messageEventListener = undefined;
    }
    async authorize(provider, cb) {
        const state = createRandomString(16);
        const token = this._auth ?? "";
        const params = { provider, token, state };
        const url = `${this._prefixUrl}authorize?${createQueryParams(params)}`;
        const win = this.popup(url, "uim-authorize-window");
        if (!win) {
            throw new Error("open authorize window error");
        }
        const res = await Promise.race([
            // 等待授权页面返回
            this.listenToAuthorizeResult(),
            // 检测授权页面关闭
            new Promise(resolve => {
                const handle = setInterval(() => {
                    if (win.closed) {
                        clearInterval(handle);
                        // 授权页 postMessage 后会关闭自己，这里延后让 message 先得到处理
                        setTimeout(() => resolve(null), 500);
                    }
                }, 500);
            }),
        ]);
        if (this._messageEventListener) {
            window.removeEventListener("message", this._messageEventListener);
        }
        this._messageEventListener = undefined;
        if (!res) {
            // 授权页窗口被用户关闭了
            cb && cb(null);
            return null;
        }
        if (res.error) {
            throw new Error(res.error);
        }
        if (res.state !== state) {
            throw new Error("invalid authorize state");
        }
        cb && cb(res.id);
        return res.id;
    }
    async listenToAuthorizeResult() {
        const { origin } = new URL(this._prefixUrl);
        return new Promise(resolve => {
            const msgEventListener = (msgEvent) => {
                if (msgEvent.origin !== origin ||
                    msgEvent.data?.type !== "authorization_response") {
                    return;
                }
                window.removeEventListener("message", msgEventListener);
                this._messageEventListener = undefined;
                return resolve(msgEvent.data);
            };
            this._messageEventListener = msgEventListener;
            window.addEventListener("message", msgEventListener);
        });
    }
    popup(url, title) {
        const dualScreenLeft = window.screenLeft ?? window.screenX;
        const dualScreenTop = window.screenTop ?? window.screenY;
        const windowWidth = window.innerWidth ?? document.documentElement.clientWidth ?? screen.width;
        const windowHeight = window.innerHeight ??
            document.documentElement.clientHeight ??
            screen.height;
        const width = Math.min(800, windowWidth / 2);
        const height = Math.min(600, windowHeight / 2);
        const left = (windowWidth - width) / 2 + dualScreenLeft;
        const top = (windowHeight - height) / 2 + dualScreenTop;
        return window.open(url, title, `scrollbars=yes, width=${width}, height=${height}, top=${top}, left=${left}`);
    }
    async request({ path, method, query, body, auth, }) {
        this.log(LogLevel.INFO, "request start", { method, path });
        // If the body is empty, don't send the body in the HTTP request
        const bodyAsJsonString = !body || Object.entries(body).length === 0
            ? undefined
            : JSON.stringify(body);
        const url = new URL(`${this._prefixUrl}${path}`);
        if (query) {
            for (const [key, value] of Object.entries(query)) {
                if (value !== undefined) {
                    url.searchParams.append(key, String(value));
                }
            }
        }
        const authHeaders = await this.authAsHeaders(auth);
        const headers = {
            ...authHeaders,
            "UIM-Version": this._uimVersion,
            "user-agent": this._userAgent,
        };
        if (bodyAsJsonString !== undefined) {
            headers["content-type"] = "application/json";
        }
        try {
            const response = await RequestTimeoutError.rejectAfterTimeout(this._fetch(url.toString(), {
                method,
                headers,
                body: bodyAsJsonString,
                agent: this._agent,
            }), this._timeoutMs);
            const responseText = await response.text();
            if (!response.ok) {
                throw buildRequestError(response, responseText);
            }
            const responseJson = JSON.parse(responseText);
            this.log(LogLevel.INFO, `request success`, { method, path });
            return responseJson;
        }
        catch (error) {
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
    on(type, handler) {
        this._handlers[type] = handler;
    }
    async listIMAccounts(args) {
        const resp = await this.request({
            method: "get",
            path: "im_accounts",
            query: pick(args, [...pageListQueryParams]),
            auth: args.auth,
        });
        if (args.subscribe && resp.data.length > 0) {
            const channels = resp.data.map(it => this.channelName(it.id));
            this._pubsub.subscribe(channels);
        }
        return resp;
    }
    async retrieveIMAccount(args) {
        const resp = await this.request({
            path: `im_accounts/${args.account_id}`,
            method: "get",
            auth: args.auth,
        });
        if (args.subscribe) {
            this._pubsub.subscribe([this.channelName(resp.id)]);
        }
        return resp;
    }
    async listContacts(args) {
        return this.request({
            path: `im_accounts/${args.account_id}/contacts`,
            method: "get",
            query: pick(args, [...cursorListQueryParams]),
            auth: args.auth,
        });
    }
    async retrieveContact(args) {
        return this.request({
            path: `im_accounts/${args.account_id}/contacts/${args.user_id}`,
            method: "get",
            auth: args.auth,
        });
    }
    async listGroups(args) {
        return this.request({
            path: `im_accounts/${args.account_id}/groups`,
            method: "get",
            query: pick(args, [...pageListQueryParams]),
            auth: args.auth,
        });
    }
    async retrieveGroup(args) {
        return this.request({
            path: `im_accounts/${args.account_id}/groups/${args.group_id}`,
            method: "get",
            auth: args.auth,
        });
    }
    listGroupMembers(args) {
        return this.request({
            path: `groups/${args.group_id}/members`,
            method: "get",
            query: pick(args, [...pageListQueryParams]),
            auth: args.auth,
        });
    }
    listConversations(args) {
        return this.request({
            path: `im_accounts/${args.account_id}/conversations`,
            method: "get",
            query: pick(args, [...cursorListQueryParams]),
            auth: args.auth,
        });
    }
    retrieveConversation(args) {
        return this.request({
            path: `conversations/${args.conversation_id}`,
            method: "get",
            auth: args.auth,
        });
    }
    listMessages(args) {
        return this.request({
            path: `conversations/${args.conversation_id}/messages`,
            method: "get",
            query: pick(args, [...cursorListQueryParams]),
            auth: args.auth,
        });
    }
    listMoments(args) {
        return this.request({
            path: args.user_id
                ? `im_accounts/${args.account_id}/contacts/${args.user_id}/moments`
                : `im_accounts/${args.account_id}/moments`,
            method: "get",
            query: pick(args, [...cursorListQueryParams]),
            auth: args.auth,
        });
    }
    sendPrivateMessage(args) {
        return this.request({
            path: "send_private_message",
            method: "post",
            body: omit(args, ["auth"]),
            auth: args.auth,
        });
    }
    sendGroupMessage(args) {
        return this.request({
            path: "send_group_message",
            method: "post",
            body: omit(args, ["auth"]),
            auth: args.auth,
        });
    }
    onIMAccountStatusUpdated(handler) {
        this.on(EventType.IM_ACCOUNT_STATUS_UPDATED, handler);
    }
    onIMAccountUpdated(handler) {
        this.on(EventType.IM_ACCOUNT_UPDATED, handler);
    }
    onNewConversation(handler) {
        this.on(EventType.NEW_CONVERSATION, handler);
    }
    onConversationUpdated(handler) {
        this.on(EventType.CONVERSATION_UPDATED, handler);
    }
    onMessageReceived(handler) {
        this.on(EventType.MESSAGE_RECEIVED, handler);
    }
    onMessageUpdated(handler) {
        this.on(EventType.MESSAGE_UPDATED, handler);
    }
    onEvent(_channel, evt, _extra) {
        const e = evt;
        const handler = this._handlers[e.type];
        handler && handler(e);
    }
    /**
     * Emits a log message to the console.
     *
     * @param level The level for this message
     * @param args Arguments to send to the console
     */
    log(level, message, extraInfo) {
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
    async authAsHeaders(auth) {
        const headers = {};
        const authHeaderValue = auth ?? this._auth;
        if (!authHeaderValue)
            return headers;
        headers["authorization"] = `Bearer ${authHeaderValue}`;
        return headers;
    }
    channelName(id) {
        return `uim/im-accounts/${id}`;
    }
}
//# sourceMappingURL=client.js.map