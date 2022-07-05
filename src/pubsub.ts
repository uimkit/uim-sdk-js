import * as Webpubsub from "webpubsub-js"

type PublishOptions = Omit<Webpubsub.PublishParameters, "channel" | "message">
type SubscribeOptions = Omit<
  Webpubsub.SubscribeParameters,
  "channels" | "channelGroups"
>
type Listener = (channel: string, evt: any, extra?: any) => void

export interface SupportedPubSub {
  publish: (
    channel: string,
    evt: any,
    options?: PublishOptions
  ) => Promise<void>
  subscribe: (channels: Array<string>, options?: SubscribeOptions) => void
  addListener: (listener: Listener) => void
}

export type PubSubOptions = Webpubsub.WebpubsubConfig

export default class PubSub {
  #client: Webpubsub

  constructor(options: PubSubOptions) {
    this.#client = new Webpubsub(options)
  }

  async publish(
    channel: string,
    evt: any,
    options?: PublishOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#client.publish(
        { channel, message: evt, ...(options ?? {}) },
        (status, _resp) => {
          if (status.error) {
            reject(status.errorData?.message)
          } else {
            resolve()
          }
        }
      )
    })
  }

  subscribe(channels: Array<string>, options?: SubscribeOptions): void {
    this.#client.subscribe({ channels, ...(options ?? {}) })
  }

  addListener(listener: Listener): void {
    this.#client.addListener({
      message: ({ channel, message, ...extra }) => {
        try {
          listener(channel, message, extra)
        } catch (e: unknown) {
          // TODO
        }
      },
    })
  }
}
