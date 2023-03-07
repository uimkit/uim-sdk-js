import { LogLevel } from '../logging';

/**
 * UIMClient 构造选项
 */
export interface UIMClientOptions {
  baseUrl?: string;
  errorHandler?: (e: unknown) => void;
  logLevel?: LogLevel;
  publishKey?: string;
  secretKey?: string;
  /** Options for pubsub */
  subscribeKey?: string;
  timeoutMs?: number;
  uimVersion?: string;
}
