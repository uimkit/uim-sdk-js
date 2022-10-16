import { Conversation, IMAccount, Message } from "./models";
export declare enum EventType {
    IM_ACCOUNT_STATUS_UPDATED = "im_account:status:updated",
    IM_ACCOUNT_UPDATED = "im_account:updated",
    NEW_CONVERSATION = "conversation:created",
    CONVERSATION_UPDATED = "conversation:updated",
    MESSAGE_RECEIVED = "message:received",
    MESSAGE_UPDATED = "message:updated"
}
export declare type EventHandler = (evt: Event) => void;
export declare type Event = UnknownEvent | IMAccountStatusUpdatedEvent | IMAccountUpdatedEvent | NewConversationEvent | ConversationUpdatedEvent | MessageReceivedEvent | MessageUpdatedEvent;
export declare type UnknownEvent = {
    type: string;
    data: unknown;
};
export declare type IMAccountStatusUpdatedEvent = {
    type: typeof EventType.IM_ACCOUNT_STATUS_UPDATED;
    data: IMAccount;
};
export declare type IMAccountStatusUpdatedHandler = (evt: IMAccountStatusUpdatedEvent) => void;
export declare type IMAccountUpdatedEvent = {
    type: typeof EventType.IM_ACCOUNT_UPDATED;
    data: IMAccount;
};
export declare type IMAccountUpdatedHandler = (evt: IMAccountUpdatedEvent) => void;
export declare type NewConversationEvent = {
    type: typeof EventType.NEW_CONVERSATION;
    data: Conversation;
};
export declare type NewConversationHandler = (evt: NewConversationEvent) => void;
export declare type ConversationUpdatedEvent = {
    type: typeof EventType.CONVERSATION_UPDATED;
    data: Conversation;
};
export declare type ConversationUpdatedHandler = (evt: ConversationUpdatedEvent) => void;
export declare type MessageReceivedEvent = {
    type: typeof EventType.MESSAGE_RECEIVED;
    data: Message;
};
export declare type MessageReceivedHandler = (evt: MessageReceivedEvent) => void;
export declare type MessageUpdatedEvent = {
    type: typeof EventType.MESSAGE_UPDATED;
    data: Message;
};
export declare type MessageUpdatedHandler = (evt: MessageUpdatedEvent) => void;
//# sourceMappingURL=events.d.ts.map