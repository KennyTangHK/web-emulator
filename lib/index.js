var util = require('util');

var debug = require('debug')('web-emulator');
var request = require('request');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Safari/602.1.50';
const ACCEPT_LANGUAGE = 'en-US;q=0.5,en;q=0.3';

const NAVIGATE_HEADERS = {
	'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
	'Accept-Language': ACCEPT_LANGUAGE,
	'User-Agent': USER_AGENT
};

const RESOURCE_REQUEST_HEADERS = {
	'Accept': 'application/json,text/javascript,*/*;q=0.01',
	'Accept-Language': ACCEPT_LANGUAGE,
	'User-Agent': USER_AGENT,
	'X-Requested-With': 'XMLHttpRequest'
};

var defer = function() {
	var defer = {};
	defer.promise = new Promise(function(resolve, reject) {
		defer.resolve = resolve;
		defer.reject = reject;
	});
	return defer;
};

function WebEmulator(referer, cookieJar, navigateHeaders, resourceRequestHeaders) {
	debug('construct');

	this.referer = referer || '';
	this.cookieJar = cookieJar || request.jar();
	this.response = null;

	this.navigateHeaders = Object.assign({}, NAVIGATE_HEADERS, navigateHeaders);
	this.resourceRequestHeaders = Object.assign({}, RESOURCE_REQUEST_HEADERS, resourceRequestHeaders);

	this.parent = null;
	this.frames = [];
}

WebEmulator.prototype.navigateTo = function(method, url, data) {
	debug('navigateTo %s "%s"', method, url);

	var options = {
		method: method,
		url: url,

		removeRefererHeader: true,
		headers: this.navigateHeaders,
		jar: this.cookieJar
	};

	if (this.referer) {
		options.headers['Referer'] = this.referer;
	}

	if (method === 'GET' && data) {
		options.qs = data;
	} else if (method === 'POST' && data) {
		options.form = data;
	}

	var self = this;
	var deferred = defer();

	var req = request(options, function(error, res) {
		if (!error) {
			debug('navigateTo success href="%s"', req.uri.href);

			self.referer = req.uri.href;
			self.response = res;
			self.destroyAllFrames();

			deferred.resolve(res);
		} else {
			debug('navigateTo error');
			deferred.reject(error);
		}
	});

	return deferred.promise;
};

WebEmulator.prototype.requestResource = function(method, url, data) {
	debug('requestResource %s "%s"', method, url);

	var options = {
		method: method,
		url: url,

		removeRefererHeader: true,
		headers: this.resourceRequestHeaders,
		jar: this.cookieJar
	};

	if (this.referer) {
		options.headers['Referer'] = this.referer;
	}

	if (method === 'GET' && data) {
		options.qs = data;
	} else if (method === 'POST' && data) {
		options.json = true;
		options.body = data;
	}

	var deferred = defer();

	var req = request(options, function(error, res) {
		if (!error) {
			debug('requestResource success href="%s"', req.uri.href);
			deferred.resolve(res);
		} else {
			debug('requestResource error');
			deferred.reject(error);
		}
	});

	return deferred.promise;
};

WebEmulator.prototype.getTo = function(url, query) {
	debug('getTo "%s"', url);
	return this.navigateTo('GET', url, query);
};

WebEmulator.prototype.postTo = function(url, form) {
	debug('postTo "%s"', url);
	return this.navigateTo('POST', url, form);
};

WebEmulator.prototype.getResource = function(url, query) {
	debug('getResource "%s"', url);
	return this.requestResource('GET', url, query);
};

WebEmulator.prototype.postResource = function(url, json) {
	debug('postResource "%s"', url);
	return this.requestResource('POST', url, json);
};

WebEmulator.prototype.createFrame = function(navigateHeaders, resourceRequestHeaders) {
	debug('createFrame');

	var frame = new WebEmulator(this.referer, this.cookieJar, navigateHeaders, resourceRequestHeaders);
	frame.parent = this;

	this.frames.push(frame);
	return frame;
};

WebEmulator.prototype.destroyAllFrames = function() {
	debug('destroyAllFrames');
	for (i in this.frames) this.frames[i] = null;
	this.frames = [];
};

exports = module.exports = WebEmulator;
