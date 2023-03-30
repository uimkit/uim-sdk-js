import UIMClient, { LogLevel } from '../src/index';

const buildClient = (): UIMClient => {
  const client = new UIMClient(process.env.UIM_ACCESS_TOKEN as string, {
    baseUrl: process.env.UIM_BASE_URL,
    subscribeKey: process.env.UIM_SUBSCRIBE_KEY,
    logLevel: LogLevel.WARN,
  });
  return client
};

export { buildClient };
