Web Emulator
============
A node module emulating the web navigation behavior.

npm package
-----------

[![NPM](https://nodei.co/npm/web-emulator.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/web-emulator/)

Features
--------

* Emulate the HTTP activities of page navigation.
* Emulate the HTTP activities of AJAX request.
* Maintain cookie jar and `Referer` URL (support redirect).
* Support using custom cookie jar.
* Emulate frames with the same cookie jar and a standalone `Referer` header.
* Built with [`request`](https://www.npmjs.com/package/request).
* Show debug message using [`debug`](https://www.npmjs.com/package/debug).

Version 1.X
-----------

This version is a breaking upgrade to 0.X web-emulator.
Please upgrade with caution.

API
---

### Class: WebEmulator

#### WebEmulator.METHOD_GET = `'GET'`

#### WebEmulator.METHOD_POST = `'POST'`

#### WebEmulator.METHOD_PUT = `'PUT'`

#### WebEmulator.METHOD_HEAD = `'HEAD'`

#### WebEmulator.METHOD_DELETE = `'DELETE'`

#### WebEmulator.METHOD_OPTIONS = `'OPTIONS'`

#### WebEmulator.METHOD_PATCH = `'PATCH'`

#### WebEmulator.jar()

Returns `request.jar()`.

The `cookieJar` is useful for sharing cookies between multiple `webEmulator` or `request()`. Please refer to [`request` documentation](https://github.com/request/request) for more details.

#### Constructor: new WebEmulator(referer[, cookieJar[, navigateHeaders[, ajaxHeaders]]])

- `referer` `<string>` The base referer URL.
- `cookieJar` `<CookieStore>` Defaults to `WebEmulator.jar()`.
- `navigateHeaders` `<Object>` The headers being merged with the default page navigation headers.
- `ajaxHeaders` `<Object>` The headers being merged with the default AJAX request headers.
- `extraOptions` `<Object>` The options being passed to `request()`.

Creates a new `WebEmulator` object with base referer URL and cookie store.
This methods will **NOT** make request to the referer URL unless you call any navigation methods to it.

The `cookieJar` will be passed to the `request()` directly.
Here's the requirement of the `cookieJar` according to [`request` documentation](https://github.com/request/request):

> The cookie store must be a [`tough-cookie`](https://github.com/SalesforceEng/tough-cookie) store and it must support synchronous operations; see the [`CookieStore` API docs](https://github.com/SalesforceEng/tough-cookie#cookiestore-api) for details.

The default page navigation headers:

```js
const DEFAULT_NAVIGATE_HEADERS = {
	'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
	'Accept-Language': 'en-US;q=0.5,en;q=0.3',
	'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.1 Safari/603.1.30',
};
```

The default AJAX request headers:

```js
const DEFAULT_AJAX_HEADERS = {
	'Accept': 'application/json,text/plain,*/*',
	'Accept-Language': 'en-US;q=0.5,en;q=0.3',
	'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.1 Safari/603.1.30',
	'X-Requested-With': 'XMLHttpRequest'
};
```

#### webEmulator.referer

- `<string>`

Gets the referer URL being sent.
The `webEmulator` will update it with the page navigation.
Not recommended to modify maually.

#### webEmulator.cookieJar

- `<CookieStore>`

Gets and sets the `cookieJar`.

#### webEmulator.navigateHeaders

- `<Object>`

Gets and sets the page navigation headers.

#### webEmulator.ajaxHeaders

- `<Object>`

Gets and sets the AJAX request headers.

#### webEmulator.parent

- `<WebEmulator>` or `null` if it is not a frame.

Gets the parent of a frame `webEmulator`.
Not recommended to modify maually.

#### webEmulator.frames

- `<Array<WebEmulator>>`

Gets the frames of the current `webEmulator`.
The array only provides the first level child frames.
Not recommended to modify maually.

#### webEmulator.isClosed

- `<boolean>`

Gets the close status.
Not recommended to modify maually.

#### webEmulator.getTo(url[, qs])

- `url` `<string>` The URL being navigated to.
- `qs` `<Object>` The querystring values.

Returns `Promise<Response>`.

Please refer to the `webEmulator.navigate()` for more details.

#### webEmulator.postTo(url[, form])

- `url` `<string>` The URL being navigated to.
- `form` `<Object>` The form data.

Returns `Promise<Response>`.

Please refer to the `webEmulator.navigate()` for more details.

#### webEmulator.navigate(method, url[, payload])

- `method` `<string>` The HTTP method. Defaults to `WebEmaultor.METHOD_GET`.
- `url` `<string>` The URL being navigated to.
- `payload` `<Object>` The headers, querystring values and form data being sent.
	- `header` `<Object> | null` The headers being sent.
	- `qs` `<Object> | null` The querystring values being sent.
	- `form` `<Object> | null` The form being sent.
	- `formData` `<Object> | null` The form data being sent.
	- `multipart` `<Object> | null` The multipart form being sent.

Returns `Promise<Response>`. The promise contains the callback value of `request()`. Please refer to [`request` documentation](https://github.com/request/request) for more details.

```js
const webEmulator = new WebEmulator('http://google.com');
webEmulator.navigate(WebEmulator.METHOD_GET, 'http://google.com')
	.then((response = {}) => {
		console.log('Status code:', response.statusCode);
		console.log('Body:', response.body);
	});
```

Emulate the behavior of page navigation.

The `method` can be any HTTP method (case-insensitive). It is not limited to the `WebEmulator.METHOD_*` constants.

The `headers` object in the `payload` object will be merged with the current page navigation headers set by `new WebEmulator()`. Please note that the `'Referer'` header will be overrided which is consistent with the browser behavior.

The `qs` object in the `payload` object will be passed to the `request()` directly. Please refer to [`request` documentation](https://github.com/request/request) for more details.

The `form`, `formData` and `multipart` objects in the `payload` object will be passed to the `request()` directly **only if the `method` is `POST`, `PUT` or `PATCH`**. Please refer to [`request` documentation](https://github.com/request/request) for more details.

Before the request resolve, the `webEmulator.referer` will be updated and any frames opened will be closed.

#### webEmulator.ajax(method, url[, payload])

- `method` `<string>` The HTTP method. Defaults to `WebEmaultor.METHOD_GET`.
- `url` `<string>` The URL being navigated to.
- `payload` `<Object>` The headers, querystring values and form data being sent.
	- `header` `<Object> | null` The headers being sent.
	- `qs` `<Object> | null` The querystring values being sent.
	- `form` `<Object> | null` The form being sent.
	- `formData` `<Object> | null` The form data being sent.
	- `multipart` `<Object> | null` The multipart form being sent.
	- `json` `<Object> | null` The JSON being sent.

Returns `Promise<Response>`. The promise contains the callback value of `request()`. Please refer to [`request` documentation](https://github.com/request/request) for more details.

Emulate the behavior of AJAX request.

The `method` can be any HTTP method (case-insensitive). It is not limited to the `WebEmulator.METHOD_*` constants.

The `headers` object in the `payload` object will be merged with the current AJAX request headers set by `new WebEmulator()`. Please note that the 'Referer' will be overrided which is consistent with the browser behavior.

The `qs`, `form`, `formData` and `multipart` objects in the `payload` object have the same behavior with `webEmulate.navigate()`. Please refer to the `webEmulator.navigate()` for more details.

The `json` object in the `payload` object will be sent as request body after `JSON.stringify()` **only if the `method` is `POST`, `PUT` or `PATCH`**.

Providing a `json` object will also override the `'Content-Type'` header with value `'application/json'`. It is **not** setting `json` to `true` for `request()`, which also means the `response.body` will **not** be `JSON.parse()`.

AJAX request will not change `webEmulator.referer` or affect any frames.

#### webEmulator.createFrame([navigateHeaders[, ajaxHeaders]])

- `navigateHeaders` `<Object>` The headers being merged with the page navigation headers of the current `webEmulator`.
- `ajaxHeaders` `<Object>` The headers being merged with the AJAX request headers of the current `webEmulator`.

Returns `WebEmulator`.

The reference of the frame will also be pushed to the `webEmulator.frames`.

The reference of the current `webEmulator` will also be kept at `frame.parent`.

#### webEmulator.closeAllFrames()

Close all frames recusively and clear the `webEmulator.frames`.
It will not affect the current `webEmulator`.

#### webEmulator.close()

Close the current `webEmulator` and all the frames recusively.
This will prevent the `webEmulator` being used.
Not recommended to call maually.

Debug
-----

```
NODE=web-emulator node app.js
```

Include `web-emulator` in the `DEBUG` environment variable to enable to debug messages. Please refer to [`debug` documentation](https://github.com/visionmedia/debug) for more details.

Usage and Examples
------------------

> Coming soon

TODO
----

- Unit test
- Support `URL` object.
- Support relative path.
- Support raw body.
- Support loading img / script resources optionally.

Repository
----------

You may find the source code on [GitHub](https://github.com/KennyTangHK/web-emulator). Please feel free to report bugs and contribute your changes.

License
-------

[GNU GPL v3.0](LICENSE.md)
