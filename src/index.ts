import { UIMClient } from "./client"

export default UIMClient
export { UIMClientOptions } from "./client"

export * from "./api-endpoints"
export * from "./models"
export * from "./events"

export { LogLevel, Logger } from "./logging"
export {
  // Error codes
  UIMErrorCode,
  APIErrorCode,
  ClientErrorCode,
  // Error types
  UIMClientError,
  APIResponseError,
  UnknownHTTPResponseError,
  RequestTimeoutError,
  // Error helpers
  isUIMClientError,
} from "./errors"
