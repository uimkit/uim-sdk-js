export declare type EmptyObject = Record<string, unknown>;
export declare type PageListQueryParameters<T> = T & {
    offset?: number;
    limit?: number;
};
export declare const pageListQueryParams: string[];
export declare type PageListExtra = {
    offset: number;
    limit: number;
    total: number;
};
export declare type PageListResponse<T> = {
    extra: PageListExtra;
    data: Array<T>;
};
export declare type Cursor = string | number;
export declare type CursorDirection = "after" | "before";
export declare type CursorListQueryParameters<T> = T & {
    cursor?: Cursor;
    direction?: CursorDirection;
    limit?: number;
};
export declare const cursorListQueryParams: string[];
export declare type CursorListExtra = {
    cursor: Cursor;
    has_more: boolean;
    limit: number;
};
export declare type CursorListResponse<T> = {
    extra: CursorListExtra;
    data: Array<T>;
};
export declare type WithMetadata<T> = T & {
    metadata?: Record<string, unknown>;
};
export declare type WithTimestamps<T> = T & {
    created_at: Date;
    updated_at?: Date;
};
export declare type Model<T> = WithTimestamps<WithMetadata<T>>;
export declare enum Gender {
    Unknown = 0,
    Male = 1,
    Female = 2
}
export declare type IMIdentity = {
    id: string;
    user_id: string;
    open_id: string;
    provider: string;
};
export declare type IMUser = Model<{
    id: string;
    user_id: string;
    custom_id?: string;
    username?: string;
    name?: string;
    mobile?: string;
    email?: string;
    avatar?: string;
    qrcode?: string;
    gender?: Gender;
    country?: string;
    province?: string;
    city?: string;
    district?: string;
    address?: string;
    signature?: string;
    birthday?: Date;
    language?: string;
    identities?: Array<IMIdentity>;
}>;
export declare enum Precense {
    Online = 1,
    Offline = 2,
    Logout = 3,
    Disabled = 4,
    DisabledByProvider = 5
}
export declare type IMAccount = Model<{
    id: string;
    user: IMUser;
    precense: Precense;
}>;
export declare type Contact = Model<{
    id: string;
    account_id: string;
    user: IMUser;
    alias?: string;
    remark?: string;
    tags?: Array<string>;
    blocked?: boolean;
    marked?: boolean;
}>;
export declare type Group = Model<{
    id: string;
    groupid: string;
    owner?: IMUser;
    name?: string;
    avatar?: string;
    announcement?: string;
    description?: string;
    member_count: number;
}>;
export declare type GroupMember = Model<{
    id: string;
    member_id: string;
    group_id: string;
    user: IMUser;
    is_owner?: boolean;
    is_admin?: boolean;
    alias?: string;
}>;
export declare enum ConversationType {
    Private = 1,
    Group = 2,
    Discussion = 3,
    System = 4,
    CustomerService = 5
}
export declare type Conversation = Model<{
    id: string;
    account_id: string;
    type: ConversationType;
    to: {
        id: string;
        name?: string;
        avatar?: string;
    };
    lastMessage?: Message;
    lastMessageAt?: Date;
    unread: number;
    pinned: boolean;
}>;
export declare enum MentionedType {
    All = 1,
    Single = 2
}
export declare type Message = Model<{
    id: string;
    message_id: string;
    conversation_type: ConversationType;
    seq: number;
    from: {
        id: string;
        name?: string;
        avatar?: string;
    };
    to: {
        id: string;
        name?: string;
        avatar?: string;
    };
    sent_at: Date;
    revoked?: boolean;
    mentioned_type?: MentionedType;
    mentioned_users?: Array<IMUser>;
    payload: MessagePayload;
}>;
export declare enum MessageType {
    Text = 1,
    Image = 2,
    Voice = 3,
    Video = 4
}
export declare type MessagePayload = TextMessagePayload | ImageMessagePayload | VoiceMessagePayload | VideoMessagePayload;
export declare type TextMessagePayload = {
    type: MessageType.Text;
    body: {
        content: string;
    };
};
export declare type ImageMessagePayload = {
    type: MessageType.Image;
    body: {
        url: string;
        width?: number;
        height?: number;
        size?: number;
        ext?: string;
        md5?: string;
        thumb?: {
            url: string;
            width?: number;
            height?: number;
            ext?: string;
        };
    };
};
export declare type VoiceMessagePayload = {
    type: MessageType.Voice;
    body: {
        url: string;
        duration?: number;
        size?: number;
        ext?: string;
        md5?: string;
    };
};
export declare type VideoMessagePayload = {
    type: MessageType.Video;
    body: {
        url: string;
        duration?: number;
        width?: number;
        height?: number;
        size?: number;
        ext?: string;
        md5?: string;
        thumb?: {
            url: string;
            width?: number;
            height?: number;
            ext?: string;
        };
    };
};
export declare type Moment = Model<{
    id: string;
    moment_id: string;
    user: IMUser;
    published_at: Date;
    is_private?: boolean;
    tags?: Array<string>;
    location?: {
        latitude?: number;
        longitude?: number;
        altitude?: number;
        accuracy?: number;
        city?: string;
        place_name?: string;
        poi_name?: string;
        poi_address?: string;
    };
    content: TextMomentContent | ImagesMomentContent | VideoMomentContent;
}>;
export declare type TextMomentContent = {
    type: 1;
    body: {
        content: string;
    };
};
export declare type ImagesMomentContent = {
    type: 2;
    body: {
        text?: string;
        images?: Array<{
            url: string;
            width?: number;
            height?: number;
            size?: number;
            ext?: string;
            md5?: string;
            thumb?: {
                url: string;
                width?: number;
                height?: number;
                ext?: string;
            };
        }>;
    };
};
export declare type VideoMomentContent = {
    type: 3;
    body: {
        text?: string;
        url: string;
        duration?: number;
        width?: number;
        height?: number;
        size?: number;
        ext?: string;
        md5?: string;
        thumb?: {
            url: string;
            width?: number;
            height?: number;
            ext?: string;
        };
    };
};
//# sourceMappingURL=models.d.ts.map