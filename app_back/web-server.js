/* global require, process */
'use strict';
const util = require('util');
const http = require('http');
const fs = require('fs');
const url = require('url');

const ReportServlet = require('./report_servlet.js');

// Some static helper functions.
function escapeHtml(value) {
  return value.toString()
    .replace('<', '&lt;')
    .replace('>', '&gt;')
    .replace('"', '&quot;');
}

function createServlet(Class, args) {
  const servlet = new Class(...args);
  return servlet.handleRequest.bind(servlet);
}

/**
 * An Http server implementation that uses a map of methods to decide
 * action routing.
 *
 * @param {Object} Map of method => Handler function
 */
function HttpServer(debug, handlers) {
  this.handlers = handlers;
  this.debug = debug;
  this.server = http.createServer(this.handleRequest_.bind(this));
}

HttpServer.prototype.getServer = function () {
  return this.server;
};

HttpServer.prototype.start = function (port) {
  this.port = port;
  this.server.listen(port);
  this.debug('Http Server running at http://localhost:' + port + '/');
  return this;
};

HttpServer.prototype.parseUrl_ = function (urlString) {
  var parsed = url.parse(urlString);
  parsed.pathname = url.resolve('/', parsed.pathname);
  return url.parse(url.format(parsed), true);
};

HttpServer.prototype.handleRequest_ = function (req, res) {
  // var logEntry = req.method + ' ' + req.url;
  // if (req.headers['user-agent']) {
  //   logEntry += ' ' + req.headers['user-agent'];
  // }
  // this.debug(logEntry);
  req.url = this.parseUrl_(req.url);

  var handler = this.handlers[req.method];
  if (!handler) {
    res.writeHead(501);
    res.end();
  } else {
    handler.call(this, req, res);
  }
};

/**
 * Servlet created purely to set CORS header values.
 */
function OptionServlet(debug, corsHeaders) {
  this.debug = debug;
  this.corsHeaders = corsHeaders;
}

OptionServlet.prototype.handleRequest = function (req, res) {
  this.corsHeaders.forEach(({header, value}) => {
    res.setHeader(header, value);
  });

  res.end();
};

/**
 * Handles static content.
 */
function StaticServlet(debug, defaultPage) {
  this.debug = debug;
  this.defaultPage = defaultPage;
}

StaticServlet.MimeMap = {
  txt: 'text/plain',
  html: 'text/html',
  css: 'text/css',
  xml: 'application/xml',
  json: 'application/json',
  js: 'application/javascript',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  png: 'image/png',
  svg: 'image/svg+xml',
};

StaticServlet.prototype.handleRequest = function (req, res) {
  var path = ('./' + req.url.pathname)
    .replace('//', '/')
    .replace(/%(..)/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

  var parts = path.split('/');
  if (parts[parts.length - 1].charAt(0) === '.') {
    return this.sendForbidden_(req, res, path);
  }
  if (parts.length === 2 && parts[1] === '') {
    parts[1] = this.defaultPage;
    return this.sendRedirect_(req, res, parts.join('/'));
  }

  fs.stat(path, (err, stat) => {
    if (err) return this.sendMissing_(req, res, path);
    if (stat.isDirectory()) return this.sendDirectory_(req, res, path);
    return this.sendFile_(req, res, path);
  });
};

StaticServlet.prototype.sendError_ = function (req, res, error) {
  res.writeHead(500, {
    'Content-Type': 'text/html',
  });
  res.write('<!doctype html>\n');
  res.write('<title>Internal Server Error</title>\n');
  res.write('<h1>Internal Server Error</h1>');
  res.write('<pre>' + escapeHtml(error) + '</pre>');
  this.debug('500 Internal Server Error');
  this.debug(util.inspect(error));
};

StaticServlet.prototype.sendMissing_ = function (req, res, path) {
  const subpath = path.substring(1);
  res.writeHead(404, {
    'Content-Type': 'text/html',
  });
  res.write('<!doctype html>\n');
  res.write('<title>404 Not Found</title>\n');
  res.write('<h1>Not Found</h1>');
  res.write(`<p>The requested URL ${escapeHtml(subpath)} was not found on this server.</p>`);
  res.end();
  this.debug(`404 Not Found: ${subpath}`);
};

StaticServlet.prototype.sendForbidden_ = function (req, res, path) {
  const subpath = path.substring(1);
  res.writeHead(403, {
    'Content-Type': 'text/html',
  });
  res.write('<!doctype html>\n');
  res.write('<title>403 Forbidden</title>\n');
  res.write('<h1>Forbidden</h1>');
  res.write(
    '<p>You do not have permission to access ' +
    escapeHtml(subpath) + ' on this server.</p>'
    );
  res.end();
  this.debug(`403 Forbidden: ${subpath}`);
};

StaticServlet.prototype.sendRedirect_ = function (req, res, redirectUrl) {
  res.writeHead(301, {
    'Content-Type': 'text/html',
    'Location': redirectUrl,
  });
  res.write('<!doctype html>\n');
  res.write('<title>301 Moved Permanently</title>\n');
  res.write('<h1>Moved Permanently</h1>');
  res.write(
    '<p>The document has moved <a href="' +
    redirectUrl +
    '">here</a>.</p>'
    );
  res.end();
  this.debug(`301 Moved Permanently: ${redirectUrl}`);
};

StaticServlet.prototype.sendFile_ = function (req, res, path) {
  var file = fs.createReadStream(path);
  res.writeHead(200, {
    'Content-Type': StaticServlet.MimeMap[path.split('.').pop()] || 'text/plain',
  });
  if (req.method === 'HEAD') {
    res.end();
  } else {
    file.on('data', res.write.bind(res));
    file.on('close', () => {
      res.end();
    });
    file.on('error', (error) => {
      this.sendError_(req, res, error);
    });
  }
};

StaticServlet.prototype.sendDirectory_ = function (req, res, path) {
  if (path.match(/[^/]$/)) {
    req.url.pathname += '/';

    var redirectUrl = url.format(url.parse(url.format(req.url)));
    return this.sendRedirect_(req, res, redirectUrl);
  }

  fs.readdir(path, (err, files) => {
    if (err) return this.sendError_(req, res, err);

    if (!files.length) return this.writeDirectoryIndex_(req, res, path, []);

    var remaining = files.length;
    files.forEach((fileName, index) => {
      fs.stat(path + '/' + fileName, (err, stat) => {
        if (err) return this.sendError_(req, res, err);
        if (stat.isDirectory()) {
          files[index] = fileName + '/';
        }
        if (!(--remaining)) return this.writeDirectoryIndex_(req, res, path, files);
      });
    });
  });
};

StaticServlet.prototype.writeDirectoryIndex_ = function (req, res, path, files) {
  const subpath = path.substring(1);
  res.writeHead(200, {
    'Content-Type': 'text/html',
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  res.write('<!doctype html>\n');
  res.write(`<title>${escapeHtml(subpath)}</title>\n`);
  res.write('<style>\n');
  res.write('  ol { list-style-type: none; font-size: 1.2em; }\n');
  res.write('</style>\n');
  res.write('<h1>Directory: ' + escapeHtml(subpath) + '</h1>');
  res.write('<ol>');
  files.forEach((fileName) => {
    if (fileName.charAt(0) !== '.') {
      res.write('<li><a href="' +
       escapeHtml(fileName) + '">' +
      escapeHtml(fileName) + '</a></li>');
    }
  });
  res.write('</ol>');
  res.end();
};

// Must be last,
exports.startServer = function startServer(config) {
  const debug = util.debuglog(config.debug.debug_name);

  new HttpServer(debug, {
    GET: createServlet(StaticServlet, [debug, config.defaul_page]),
    HEAD: createServlet(StaticServlet, [debug, config.defaul_page]),
    POST: createServlet(ReportServlet, [config]),
    OPTIONS: createServlet(OptionServlet, [debug, config.cors_headers]),
  }).start(config.server_port);
};
