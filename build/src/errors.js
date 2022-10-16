import { isObject } from "./helpers";
/**
 * Error codes returned in responses from the API.
 */
export var APIErrorCode;
(function (APIErrorCode) {
    APIErrorCode["Unauthorized"] = "unauthorized";
    APIErrorCode["RestrictedResource"] = "restricted_resource";
    APIErrorCode["ObjectNotFound"] = "object_not_found";
    APIErrorCode["RateLimited"] = "rate_limited";
    APIErrorCode["InvalidJSON"] = "invalid_json";
    APIErrorCode["InvalidRequestURL"] = "invalid_request_url";
    APIErrorCode["InvalidRequest"] = "invalid_request";
    APIErrorCode["ValidationError"] = "validation_error";
    APIErrorCode["ConflictError"] = "conflict_error";
    APIErrorCode["InternalServerError"] = "internal_server_error";
    APIErrorCode["ServiceUnavailable"] = "service_unavailable";
})(APIErrorCode || (APIErrorCode = {}));
/**
 * Error codes generated for client errors.
 */
export var ClientErrorCode;
(function (ClientErrorCode) {
    ClientErrorCode["RequestTimeout"] = "uim_client_request_timeout";
    ClientErrorCode["ResponseError"] = "uim_client_response_error";
})(ClientErrorCode || (ClientErrorCode = {}));
/**
 * Base error type.
 */
class UIMClientErrorBase extends Error {
}
/**
 * @param error any value, usually a caught error.
 * @returns `true` if error is a `UIMClientError`.
 */
export function isUIMClientError(error) {
    return isObject(error) && error instanceof UIMClientErrorBase;
}
/**
 * Narrows down the types of a UIMClientError.
 * @param error any value, usually a caught error.
 * @param codes an object mapping from possible error codes to `true`
 * @returns `true` if error is a `UIMClientError` with a code in `codes`.
 */
function isUIMClientErrorWithCode(error, codes) {
    return isUIMClientError(error) && error.code in codes;
}
/**
 * Error thrown by the client if a request times out.
 */
export class RequestTimeoutError extends UIMClientErrorBase {
    code = ClientErrorCode.RequestTimeout;
    name = "RequestTimeoutError";
    constructor(message = "Request to UIM API has timed out") {
        super(message);
    }
    static isRequestTimeoutError(error) {
        return isUIMClientErrorWithCode(error, {
            [ClientErrorCode.RequestTimeout]: true,
        });
    }
    static rejectAfterTimeout(promise, timeoutMS) {
        return new Promise((resolve, reject) => {
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
class HTTPResponseError extends UIMClientErrorBase {
    name = "HTTPResponseError";
    code;
    status;
    headers;
    body;
    constructor(args) {
        super(args.message);
        const { code, status, headers, rawBodyText } = args;
        this.code = code;
        this.status = status;
        this.headers = headers;
        this.body = rawBodyText;
    }
}
const httpResponseErrorCodes = {
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
export function isHTTPResponseError(error) {
    if (!isUIMClientErrorWithCode(error, httpResponseErrorCodes)) {
        return false;
    }
    return true;
}
/**
 * Error thrown if an API call responds with an unknown error code, or does not respond with
 * a property-formatted error.
 */
export class UnknownHTTPResponseError extends HTTPResponseError {
    name = "UnknownHTTPResponseError";
    constructor(args) {
        super({
            ...args,
            code: ClientErrorCode.ResponseError,
            message: args.message ?? `Request to UIM API failed with status: ${args.status}`,
        });
    }
    static isUnknownHTTPResponseError(error) {
        return isUIMClientErrorWithCode(error, {
            [ClientErrorCode.ResponseError]: true,
        });
    }
}
const apiErrorCodes = {
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
export class APIResponseError extends HTTPResponseError {
    name = "APIResponseError";
    static isAPIResponseError(error) {
        return isUIMClientErrorWithCode(error, apiErrorCodes);
    }
}
export function buildRequestError(response, bodyText) {
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
function parseAPIErrorResponseBody(body) {
    if (typeof body !== "string") {
        return;
    }
    let parsed;
    try {
        parsed = JSON.parse(body);
    }
    catch (parseError) {
        return;
    }
    if (!isObject(parsed) ||
        typeof parsed["message"] !== "string" ||
        !isAPIErrorCode(parsed["code"])) {
        return;
    }
    return {
        ...parsed,
        code: parsed["code"],
        message: parsed["message"],
    };
}
function isAPIErrorCode(code) {
    return typeof code === "string" && code in apiErrorCodes;
}
//# sourceMappingURL=errors.js.map