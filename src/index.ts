import { UIMClient } from "./client"

export default UIMClient
export { UIMClientOptions } from "./client"

export * from "./api-endpoints"
export * from "./events"
export * from "./models"
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
