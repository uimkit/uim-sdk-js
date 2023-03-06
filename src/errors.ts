import { SupportedResponse } from './fetch-types';
import { isObject } from './helpers';
import { Assert } from './type-utils';

/**
 * Error codes returned in responses from the API.
 */
export enum APIErrorCode {
  ConflictError = 'conflict_error',
  InternalServerError = 'internal_server_error',
  InvalidJSON = 'invalid_json',
  InvalidRequest = 'invalid_request',
  InvalidRequestURL = 'invalid_request_url',
  ObjectNotFound = 'object_not_found',
  RateLimited = 'rate_limited',
  RestrictedResource = 'restricted_resource',
  ServiceUnavailable = 'service_unavailable',
  Unauthorized = 'unauthorized',
  ValidationError = 'validation_error',
}

/**
 * Error codes generated for client errors.
 */
export enum ClientErrorCode {
  RequestTimeout = 'uim_client_request_timeout',
  ResponseError = 'uim_client_response_error',
}

/**
 * Error codes on errors thrown by the `Client`.
 */
export type UIMErrorCode = APIErrorCode | ClientErrorCode;

/**
 * Base error type.
 */
abstract class UIMClientErrorBase<Code extends UIMErrorCode> extends Error {
  abstract code: Code;
}

/**
 * Error type that encompasses all the kinds of errors that the UIM client will throw.
 */
export type UIMClientError = RequestTimeoutError | UnknownHTTPResponseError | APIResponseError;

// Assert that UIMClientError's `code` property is a narrow type.
// This prevents us from accidentally regressing to `string`-typed name field.
type _assertCodeIsNarrow = Assert<UIMErrorCode, UIMClientError['code']>;

// Assert that the type of `name` in UIMErrorCode is a narrow type.
// This prevents us from accidentally regressing to `string`-typed name field.
type _assertNameIsNarrow = Assert<
  'RequestTimeoutError' | 'UnknownHTTPResponseError' | 'APIResponseError',
  UIMClientError['name']
>;

/**
 * @param error any value, usually a caught error.
 * @returns `true` if error is a `UIMClientError`.
 */
export function isUIMClientError(error: unknown): error is UIMClientError {
  return isObject(error) && error instanceof UIMClientErrorBase;
}

/**
 * Narrows down the types of a UIMClientError.
 * @param error any value, usually a caught error.
 * @param codes an object mapping from possible error codes to `true`
 * @returns `true` if error is a `UIMClientError` with a code in `codes`.
 */
function isUIMClientErrorWithCode<Code extends UIMErrorCode>(
  error: unknown,
  codes: { [C in Code]: true },
): error is UIMClientError & { code: Code } {
  return isUIMClientError(error) && error.code in codes;
}

/**
 * Error thrown by the client if a request times out.
 */
export class RequestTimeoutError extends UIMClientErrorBase<ClientErrorCode.RequestTimeout> {
  readonly code = ClientErrorCode.RequestTimeout;
  readonly name = 'RequestTimeoutError';

  constructor(message = 'Request to UIM API has timed out') {
    super(message);
  }

  static isRequestTimeoutError(error: unknown): error is RequestTimeoutError {
    return isUIMClientErrorWithCode(error, {
      [ClientErrorCode.RequestTimeout]: true,
    });
  }

  static rejectAfterTimeout<T>(promise: Promise<T>, timeoutMS: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new RequestTimeoutError());
      }, timeoutMS);

      promise
        .then(resolve)
        .catch(reject)
        .then(() => clearTimeout(timeoutId));
    });
  }
}

type HTTPResponseErrorCode = ClientErrorCode.ResponseError | APIErrorCode;

class HTTPResponseError<Code extends HTTPResponseErrorCode> extends UIMClientErrorBase<Code> {
  readonly name: string = 'HTTPResponseError';
  readonly code: Code;
  readonly status: number;
  readonly headers: SupportedResponse['headers'];
  readonly body: string;

  constructor(args: {
    code: Code;
    headers: SupportedResponse['headers'];
    message: string;
    rawBodyText: string;
    status: number;
  }) {
    super(args.message);
    const { code, status, headers, rawBodyText } = args;
    this.code = code;
    this.status = status;
    this.headers = headers;
    this.body = rawBodyText;
  }
}

const httpResponseErrorCodes: { [C in HTTPResponseErrorCode]: true } = {
  [ClientErrorCode.ResponseError]: true,
  [APIErrorCode.Unauthorized]: true,
  [APIErrorCode.RestrictedResource]: true,
  [APIErrorCode.ObjectNotFound]: true,
  [APIErrorCode.RateLimited]: true,
  [APIErrorCode.InvalidJSON]: true,
  [APIErrorCode.InvalidRequestURL]: true,
  [APIErrorCode.InvalidRequest]: true,
  [APIErrorCode.ValidationError]: true,
  [APIErrorCode.ConflictError]: true,
  [APIErrorCode.InternalServerError]: true,
  [APIErrorCode.ServiceUnavailable]: true,
};

export function isHTTPResponseError(error: unknown): error is UnknownHTTPResponseError | APIResponseError {
  if (!isUIMClientErrorWithCode(error, httpResponseErrorCodes)) {
    return false;
  }

  type _assert = Assert<UnknownHTTPResponseError | APIResponseError, typeof error>;

  return true;
}

/**
 * Error thrown if an API call responds with an unknown error code, or does not respond with
 * a property-formatted error.
 */
export class UnknownHTTPResponseError extends HTTPResponseError<ClientErrorCode.ResponseError> {
  readonly name = 'UnknownHTTPResponseError';

  constructor(args: {
    headers: SupportedResponse['headers'];
    message: string | undefined;
    rawBodyText: string;
    status: number;
  }) {
    super({
      ...args,
      code: ClientErrorCode.ResponseError,
      message: args.message ?? `Request to UIM API failed with status: ${args.status}`,
    });
  }

  static isUnknownHTTPResponseError(error: unknown): error is UnknownHTTPResponseError {
    return isUIMClientErrorWithCode(error, {
      [ClientErrorCode.ResponseError]: true,
    });
  }
}

const apiErrorCodes: { [C in APIErrorCode]: true } = {
  [APIErrorCode.Unauthorized]: true,
  [APIErrorCode.RestrictedResource]: true,
  [APIErrorCode.ObjectNotFound]: true,
  [APIErrorCode.RateLimited]: true,
  [APIErrorCode.InvalidJSON]: true,
  [APIErrorCode.InvalidRequestURL]: true,
  [APIErrorCode.InvalidRequest]: true,
  [APIErrorCode.ValidationError]: true,
  [APIErrorCode.ConflictError]: true,
  [APIErrorCode.InternalServerError]: true,
  [APIErrorCode.ServiceUnavailable]: true,
};

/**
 * A response from the API indicating a problem.
 * Use the `code` property to handle various kinds of errors. All its possible values are in `APIErrorCode`.
 */
export class APIResponseError extends HTTPResponseError<APIErrorCode> {
  readonly name = 'APIResponseError';

  static isAPIResponseError(error: unknown): error is APIResponseError {
    return isUIMClientErrorWithCode(error, apiErrorCodes);
  }
}

export function buildRequestError(
  response: SupportedResponse,
  bodyText: string,
): APIResponseError | UnknownHTTPResponseError {
  const apiErrorResponseBody = parseAPIErrorResponseBody(bodyText);
  if (apiErrorResponseBody !== undefined) {
    return new APIResponseError({
      code: apiErrorResponseBody.code,
      message: apiErrorResponseBody.message,
      headers: response.headers,
      status: response.status,
      rawBodyText: bodyText,
    });
  }
  return new UnknownHTTPResponseError({
    message: undefined,
    headers: response.headers,
    status: response.status,
    rawBodyText: bodyText,
  });
}

function parseAPIErrorResponseBody(body: string): { code: APIErrorCode; message: string } | undefined {
  if (typeof body !== 'string') {
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch (parseError) {
    return;
  }

  if (!isObject(parsed) || typeof parsed['message'] !== 'string' || !isAPIErrorCode(parsed['code'])) {
    return;
  }

  return {
    ...parsed,
    code: parsed['code'],
    message: parsed['message'],
  };
}

function isAPIErrorCode(code: unknown): code is APIErrorCode {
  return typeof code === 'string' && code in apiErrorCodes;
}
