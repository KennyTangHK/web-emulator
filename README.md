Web Emulator
============
A node module emulating the web navigation behavior.

Installation
------------

> `npm i web-emulator`

Features
--------

* `GET` and `POST` to pages.
* `GET` and `POST` to resources.
* Maintain cookie jar and `Referer` header (support redirect).
* Support using custom cookie jar.
* Emulate frames with the same cookie jar and a standalone `Referer` header.
* Built with [`request`](https://www.npmjs.com/package/request).
* Show debug message using [`debug`](https://www.npmjs.com/package/debug).

Usage
-----

```javascript
var WebEmulator = require('web-emulator');

// Create emulator.
var emulator = new WebEmulator();

// Go to https://httpbin.org/
emulator.getTo('https://httpbin.org/')
    .then(function(response) {
    	// Get resource https://httpbin.org/headers
    	return emulator.getResource('https://httpbin.org/headers');
    })
    .then(function(response) {
    	// response.body.headers.Referer === 'https://httpbin.org/'
    });
```

Options
-------

> Coming soon

Methods
-------

> Coming soon

Repository
----------

You may find the source code on [GitHub](https://github.com/KennyTangHK/web-emulator). Please feel free to report bugs and contribute your changes.

License
-------

[GNU GPL v3.0](LICENSE.md)
