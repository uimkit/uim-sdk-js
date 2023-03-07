import UIMClient from '../src/index.node';

const buildClient = (): UIMClient => {
  return new UIMClient(process.env.UIM_ACCESS_TOKEN as string, {
    baseUrl: process.env.UIM_BASE_URL,
    publishKey: process.env.UIM_PUBLISH_KEY,
    subscribeKey: process.env.UIM_SUBSCRIBE_KEY,
    secretKey: process.env.UIM_SECRET_KEY,
  });
};

export { buildClient };
