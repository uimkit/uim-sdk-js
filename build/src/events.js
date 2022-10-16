// cspell:disable-file
export var EventType;
(function (EventType) {
    // 账号状态变更
    EventType["IM_ACCOUNT_STATUS_UPDATED"] = "im_account:status:updated";
    // 账号信息变更
    EventType["IM_ACCOUNT_UPDATED"] = "im_account:updated";
    // 新会话通知
    EventType["NEW_CONVERSATION"] = "conversation:created";
    // 会话信息变更
    EventType["CONVERSATION_UPDATED"] = "conversation:updated";
    // 收到消息
    EventType["MESSAGE_RECEIVED"] = "message:received";
    // 消息更新
    EventType["MESSAGE_UPDATED"] = "message:updated";
})(EventType || (EventType = {}));
//# sourceMappingURL=events.js.map