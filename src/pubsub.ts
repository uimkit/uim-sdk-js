import Webpubsub from 'webpubsub-js';

export type PublishOptions = Omit<Webpubsub.PublishParameters, 'channel' | 'message'>;

export type SubscribeOptions = Omit<Webpubsub.SubscribeParameters, 'channels' | 'channelGroups'>;

export type Listener = (channel: string, message: unknown, extra?: unknown) => void;

export type PubSubOptions = Webpubsub.WebpubsubConfig;

export interface SupportedPubSub {
  addListener: (listener: Listener) => void;
  publish: (channel: string, message: unknown, options?: PublishOptions) => Promise<void>;
  subscribe: (channels: Array<string>, options?: SubscribeOptions) => void;
  unsubscribe: (channels: Array<string>) => void;
}

export default class PubSub {
  _client: Webpubsub;

  constructor(options: PubSubOptions) {
    this._client = new Webpubsub(options);
  }

  async publish(channel: string, message: unknown, options?: PublishOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      this._client.publish({ channel, message, ...(options ?? {}) }, (status, _resp) => {
        // TODO error handling
        if (status.error) {
          reject(status.errorData?.message);
        } else {
          resolve();
        }
      });
    });
  }

  subscribe(channels: Array<string>, options?: SubscribeOptions): void {
    this._client.subscribe({ channels, ...(options ?? {}) });
  }

  unsubscribe(channels: Array<string>): void {
    this._client.unsubscribe({ channels });
  }

  addListener(listener: Listener): void {
    this._client.addListener({
      message: ({ channel, message, ...extra }) => {
        try {
          listener(channel, message, extra);
        } catch (e: unknown) {
          // TODO error handling
        }
      },
    });
  }
}
