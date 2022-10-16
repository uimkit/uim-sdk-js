import Webpubsub from "webpubsub-js";
export default class PubSub {
    _client;
    constructor(options) {
        this._client = new Webpubsub(options);
    }
    async publish(channel, message, options) {
        return new Promise((resolve, reject) => {
            this._client.publish({ channel, message, ...(options ?? {}) }, (status, _resp) => {
                // TODO error handling
                if (status.error) {
                    reject(status.errorData?.message);
                }
                else {
                    resolve();
                }
            });
        });
    }
    subscribe(channels, options) {
        this._client.subscribe({ channels, ...(options ?? {}) });
    }
    addListener(listener) {
        this._client.addListener({
            message: ({ channel, message, ...extra }) => {
                try {
                    listener(channel, message, extra);
                }
                catch (e) {
                    // TODO error handling
                }
            },
        });
    }
}
//# sourceMappingURL=pubsub.js.map