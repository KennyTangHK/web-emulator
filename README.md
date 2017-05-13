Web Emulator
============
A node module emulating the web navigation behavior.

Installation
------------

> `npm i web-emulator`

Features
--------

* Emulate the http activities of page navigation.
* Emulate the http activities of AJAX request.
* Maintain cookie jar and `Referer` header (support redirect).
* Support using custom cookie jar.
* Emulate frames with the same cookie jar and a standalone `Referer` header.
* Built with [`request`](https://www.npmjs.com/package/request).
* Show debug message using [`debug`](https://www.npmjs.com/package/debug).

Version 1.X
-----------
This version is a breaking upgrade to 0.X web-emulator.
Please upgrade with caution.

Usage
-----

```javascript
const WebEmulator = require('web-emulator');

// Create emulator.
const emulator = new WebEmulator();

// Go to https://httpbin.org/
emulator.getTo('https://httpbin.org/?key=value')
    .then(function(response) {
        // Get resource https://httpbin.org/headers
        return emulator.ajax('GET', 'https://httpbin.org/headers');
    })
    .then(function(response) {
        // response.body.headers.Referer === 'https://httpbin.org/?key=value'
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
