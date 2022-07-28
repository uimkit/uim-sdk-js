<div align="center">
	<h1>UIM Client SDK for JavaScript</h1>
	<p>
		<b>A simple and easy client for the <a href="https://docs.uimkit.chat">UIM API</a></b>
	</p>
	<br>
</div>

![Build status](https://github.com/uimkit/uim-sdk-js/actions/workflows/ci.yml/badge.svg)
[![npm version](https://badge.fury.io/js/%40uimkit%2Fclient.svg)](https://www.npmjs.com/package/@uimkit/client)

## Installation

```
npm install @uimkit/client
```

## Usage

> Use UIM's [Getting Started Guide](https://docs.uimkit.chat/getting-started) to get set up to use UIM's API.

Import and initialize a client using an **integration token** or an OAuth **access token**.

```js
const { Client } = require("@uimkit/client")

// Initializing a client
const client = new Client(process.env.ACCESS_TOKEN, {})
```

Make a request to any UIM API endpoint.

> See the complete list of endpoints in the [API reference](https://docs.uimkit.chat/reference).

```js
;(async () => {
  const response = await client.imAccounts.list({})
})()
```

Each method returns a `Promise` which resolves the response.

```js
console.log(response)
```

```
{
  data: [
    {
      id: 'd40e767c-d7af-4b18-a86d-55c61f1e39a4',
      email: 'avo@example.org',
      name: 'Avocado Lovelace',
      avatar: 'https://s.uimkit.chat/e6a352a8-8381-44d0-a1dc-9ed80e62b53d.jpg',
    },
    ...
  ],
  extra: {
    offset: 0,
    limit: 20,
    totol: 36
  }
}
```

Endpoint parameters are grouped into a single object. You don't need to remember which parameters go in the path, query, or body.

```js
const response = await client.contacts.list({
  im_account_id: "897e5a76-ae52-4b48-9fdf-e71f5945d1af",
})
```

Send accounts' commands to UIM API

> See the complete list of commands in the [API reference](https://docs.uimkit.chat/reference).

```js
await client.conversations.sendMessage({
  account_id: "897e5a76-ae52-4b48-9fdf-e71f5945d1af",
  conversation_id: "897e5a76-ae52-4b48-9fdf-e71f5945d1af",
  payload: {
    type: 1,
    body: {
      content: "hello",
    },
  },
})
```

Handle accounts' events from UIM API.

> See the complete list of events in the [API reference](https://docs.uimkit.chat/reference).

```js
client.conversations.onNewMessage((evt: NewMessage) => {
  console.log(`new message id: ${evt.payload.id}`)
})
```

### Handling errors

If the API returns an unsuccessful response, the returned `Promise` rejects with a `APIResponseError`.

The error contains properties from the response, and the most helpful is `code`. You can compare `code` to the values in the `APIErrorCode` object to avoid misspelling error codes.

```js
const { Client, APIErrorCode } = require("@uimkit/client")

try {
  const response = await client.contacts.list({
    im_account_id: "897e5a76-ae52-4b48-9fdf-e71f5945d1af",
  })
} catch (error) {
  if (error.code === APIErrorCode.ObjectNotFound) {
    //
    // For example: handle by asking the user to select a different database
    //
  } else {
    // Other error handling code
    console.error(error)
  }
}
```

### Logging

The client emits useful information to a logger. By default, it only emits warnings and errors.

If you're debugging an application, and would like the client to log response bodies, set the `logLevel` option to `LogLevel.DEBUG`.

```js
const { Client, LogLevel } = require("@uimkit/client")

const client = new Client(process.env.ACCESS_TOKEN, {
  logLevel: LogLevel.DEBUG,
})
```

You may also set a custom `logger` to emit logs to a destination other than `stdout`. A custom logger is a function which is called with 3 parameters: `logLevel`, `message`, and `extraInfo`. The custom logger should not return a value.

### Client options

The `Client` supports the following options on initialization. These options are all keys in the single constructor parameter.

| Option      | Default value               | Type         | Description                                                                                                                                                  |
| ----------- | --------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `logLevel`  | `LogLevel.WARN`             | `LogLevel`   | Verbosity of logs the instance will produce. By default, logs are written to `stdout`.                                                                       |
| `timeoutMs` | `60_000`                    | `number`     | Number of milliseconds to wait before emitting a `RequestTimeoutError`                                                                                       |
| `baseUrl`   | `"https://api.uimkit.chat/client/v1"` | `string`     | The root URL for sending API requests. This can be changed to test with a mock server.                                                                       |
| `logger`    | Log to console              | `Logger`     | A custom logging function. This function is only called when the client emits a log that is equal or greater severity than `logLevel`.                       |
| `agent`     | Default node agent          | `http.Agent` | Used to control creation of TCP sockets. A common use is to proxy requests with [`https-proxy-agent`](https://github.com/TooTallNate/node-https-proxy-agent) |

### TypeScript

This package contains type definitions for **all request parameters and responses**.

Because errors in TypeScript start with type `any` or `unknown`, you should use
the `isUIMClientError` type guard to handle them in a type-safe way. Each
`UIMClientError` type is uniquely identified by its `error.code`. Codes in
the `APIErrorCode` enum are returned from the server. Codes in the
`ClientErrorCode` enum are produced on the client.

```ts
try {
  const response = await client.contacts.list({
    /* ... */
  })
} catch (error: unknown) {
  if (isUIMClientError(error)) {
    // error is now strongly typed to UIMClientError
    switch (error.code) {
      case ClientErrorCode.RequestTimeout:
        // ...
        break
      case APIErrorCode.ObjectNotFound:
        // ...
        break
      case APIErrorCode.Unauthorized:
        // ...
        break
      // ...
      default:
        // you could even take advantage of exhaustiveness checking
        assertNever(error.code)
    }
  }
}
```

## Requirements

This package supports the following minimum versions:

- Runtime: `node >= 12`
- Type definitions (optional): `typescript >= 4.2`

Earlier versions may still work, but we encourage people building new applications to upgrade to the current stable.

## Getting help

If you want to submit a feature request for UIM's API, or are experiencing any issues with the API platform, please email us at `contact@uimkit.chat`.

To report issues with the SDK, it is possible to [submit an issue](https://github.com/uimkit/uim-sdk-js/issues) to this repo. However, we don't monitor these issues very closely. We recommend you reach out to us at `contact@uimkit.chat` instead.
