const url = require('url');

const debug = require('debug')('web-emulator');

const extend = require('lodash.assignin');
const request = require('request');

const DEFAULT_NAVIGATE_HEADERS = {
	'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
	'Accept-Language': 'en-US;q=0.5,en;q=0.3',
	'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.1 Safari/603.1.30',
};

const DEFAULT_AJAX_HEADERS = {
	'Accept': 'application/json,text/plain,*/*',
	'Accept-Language': 'en-US;q=0.5,en;q=0.3',
	'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.1 Safari/603.1.30',
	'X-Requested-With': 'XMLHttpRequest'
};

const defer = () => {
	const deferred = {};
	deferred.promise = new Promise((resolve, reject) => {
		deferred.resolve = resolve;
		deferred.reject = reject;
	});
	return deferred;
};

class WebEmulator {
	static get METHOD_GET() { return 'GET' }
	static get METHOD_POST() { return 'POST' }
	static get METHOD_PUT() { return 'PUT' }
	static get METHOD_HEAD() { return 'HEAD' }
	static get METHOD_DELETE() { return 'DELETE' }
	static get METHOD_OPTIONS() { return 'OPTIONS' }
	static get METHOD_PATCH() { return 'PATCH' }

	static jar() { return request.jar() }

	constructor(referer = '', cookieJar = WebEmulator.jar(), navigateHeaders = {}, ajaxHeaders = {}) {
		debug(`[constructor]`);

		this.referer = referer;
		this.cookieJar = cookieJar;

		this.navigateHeaders = extend({}, DEFAULT_NAVIGATE_HEADERS, navigateHeaders);
		this.ajaxHeaders = extend({}, DEFAULT_AJAX_HEADERS, ajaxHeaders);
		
		this.parent = null;
		this.frames = [];

		this.isClosed = false;
	}

	navigate(method = WebEmulator.METHOD_GET, url = '', payload = {}) {
		debug(`[navigate] ${method} ${url}`);

		if (this.isClosed === true) {
			debug(`[navigate] reject page / frame closed`);
			return Promise.reject('page-closed');
		}

		if (!url) {
			debug(`[navigate] no url`);
			return Promise.reject('no-url');
		}

		const options = {
			method, url,
			removeRefererHeader: true,
			headers: this.navigateHeaders,
			jar: this.cookieJar,
		};

		if (payload.headers) options.headers = extend({}, options.headers, payload.headers);
		if (payload.qs) options.qs = payload.qs;

		if ([WebEmulator.METHOD_POST, WebEmulator.METHOD_PUT, WebEmulator.METHOD_PATCH].indexOf(method.toUpperCase()) > -1) {
			if (payload.form) options.form = payload.form;
			if (payload.formData) options.formData = payload.formData;
			if (payload.multipart) options.multipart = payload.multipart;
		}

		if (this.referer) options.headers['Referer'] = this.referer;

		const deferred = defer();

		debug(`[navigate]`, options);
		request(options, (error, response) => {
			if (error) {
				debug(`[navigate] reject`);
				deferred.reject(error);
				return;
			}

			const href = response.request.uri.href;

			debug(`[navigate] resolve href = ${href}`);

			this.closeAllFrames();

			if (response.statusCode >= 300 && response.statusCode < 400 && response.caseless.has('location')) {
				debug(`[navigate] missed redirect location = ${response.caseless.has('location')}`);

				const redirectUrl = url.resolve(href, response.caseless.get('location'));
				deferred.resolve(() => this.navigate(WebEmulator.METHOD_GET, redirectUrl));

				return;
			}

			this.referer = href;

			deferred.resolve(response);
		});

		return deferred.promise;
	}

	ajax(method = WebEmulator.METHOD_GET, url = '', payload = {}) {
		debug(`[ajax] ${method} ${url}`);

		if (this.isClosed === true) {
			debug(`[ajax] reject page / frame closed`);
			return Promise.reject('page-closed');
		}

		if (!url) {
			debug(`[ajax] no url`);
			return Promise.reject('no-url');
		}

		const options = {
			method, url,
			removeRefererHeader: true,
			headers: this.ajaxHeaders,
			jar: this.cookieJar,
		};

		if (payload.headers) options.headers = extend({}, options.headers, payload.headers);
		if (payload.qs) options.qs = payload.qs;

		if ([WebEmulator.METHOD_POST, WebEmulator.METHOD_PUT, WebEmulator.METHOD_PATCH].indexOf(method.toUpperCase()) > -1) {
			if (payload.json) {
				options.headers['Content-Type'] = 'application/json';
				options.body = JSON.stringify(payload.json);
			}

			if (payload.form) options.form = payload.form;
			if (payload.formData) options.formData = payload.formData;
			if (payload.multipart) options.multipart = payload.multipart;
		}

		if (this.referer) options.headers['Referer'] = this.referer;

		const deferred = defer();

		debug(`[ajax]`, options);
		request(options, (error, response) => {
			if (error) {
				debug(`[ajax] reject`);
				deferred.reject(error);
				return;
			}

			const href = response.request.uri.href;

			debug(`[ajax] resolve href = ${href}`);

			if (response.statusCode >= 300 && response.statusCode < 400 && response.caseless.has('location')) {
				debug(`[ajax] missed redirect location = ${response.caseless.has('location')}`);

				const redirectUrl = url.resolve(href, response.caseless.get('location'));
				deferred.resolve(() => this.ajax(WebEmulator.METHOD_GET, redirectUrl));

				return;
			}

			deferred.resolve(response);
		});

		return deferred.promise;
	}

	getTo(url = '', qs = {}) {
		debug(`[getTo] ${url}`);
		return this.navigate(WebEmulator.METHOD_GET, url, { qs });
	}

	postTo(url = '', form = {}) {
		debug(`[postTo] ${url}`);
		return this.navigate(WebEmulator.METHOD_POST, url, { form });
	}

	createFrame(navigateHeaders = {}, ajaxHeaders = {}) {
		debug(`[createFrame]`);

		if (this.isClosed === true) {
			debug('[createFrame] reject page / frame closed');
			return Promise.reject('page-closed');
		}

		const frame = new WebEmulator(
			this.referer,
			this.cookieJar,
			extend({}, this.navigateHeaders, navigateHeaders),
			extend({}, this.ajaxHeaders, ajaxHeaders)
		);

		frame.parent = this;
		this.frames.push(frame);

		return frame;
	}

	closeAllFrames() {
		debug(`[closeAllFrames]`);

		for (i in this.frames) {
			this.frames[i].close();
			this.frames[i] = null;
		}

		this.frames = [];
	}

	close() {
		debug(`[close]`);

		this.isClosed = true;
		this.closeAllFrames();
	}
}

exports = module.exports = WebEmulator;
