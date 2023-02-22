import { Client } from "./client"

export default Client

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
