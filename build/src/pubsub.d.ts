import Webpubsub from "webpubsub-js";
export declare type PublishOptions = Omit<Webpubsub.PublishParameters, "channel" | "message">;
export declare type SubscribeOptions = Omit<Webpubsub.SubscribeParameters, "channels" | "channelGroups">;
export declare type Listener = (channel: string, message: unknown, extra?: unknown) => void;
export declare type PubSubOptions = Webpubsub.WebpubsubConfig;
export interface SupportedPubSub {
    publish: (channel: string, message: unknown, options?: PublishOptions) => Promise<void>;
    subscribe: (channels: Array<string>, options?: SubscribeOptions) => void;
    addListener: (listener: Listener) => void;
}
export default class PubSub {
    _client: Webpubsub;
    constructor(options: PubSubOptions);
    publish(channel: string, message: unknown, options?: PublishOptions): Promise<void>;
    subscribe(channels: Array<string>, options?: SubscribeOptions): void;
    addListener(listener: Listener): void;
}
//# sourceMappingURL=pubsub.d.ts.map