var _ = require('lodash')
  , assert = require('assert')
  , async = require('async')
  , cookieParser = require('cookie-parser')
  , express = require('express')
  , extract = require('./extract')
  , fmt = require('util').format
  , fs = require('fs')
  , http = require('http')
  , json = JSON.stringify
  , multer = require('multer')
  , os = require('os')
  , path = require('path')
  , url = require('url')
  , util = require('util')
  , ws = require('ws')
  , EventProcessor = require('../util/EventProcessor')
  ;


/**
 * HTTP server with a Websocket upgrade.
 *
 * @constructor
 * @param {?HttpServerOptions} config
 */
function HttpServer(config) {
  EventProcessor.call(this);
  this.config_ = config;

  // Active connection and request registry for this server, keyed by clientId.
  this.clients_ = {
    wsRequests: {},
    wsConnections: {},
    httpRequests: {},
  };

  // Create Express app to parse HTTP uploads and other requests.
  var app = this.expressApp_ = express();
  app.use(cookieParser());
  app.post('/__bs__/upload', multer({
    dest: config.server.upload_dir,
  }).any());
  app.use(this.onHttpIncomingRequest.bind(this));

  // Create HTTP server with Express app in request chain.
  this.httpServer_ = http.createServer(app);

  // Create Websocket server and hook up its event handlers.
  // wsServer options are for the ws module:
  // https://github.com/websockets/ws/blob/master/doc/ws.md
  var wsOptions = {
    path: '/__bs__/live',
    perMessageDeflate: true,
    server: this.httpServer_,
    verifyClient: this.onWsVerifyClient.bind(this),
  };
  this.wsServer_ = new ws.Server(wsOptions);
  this.wsServer_.on('connection', this.onWsConnectionStart.bind(this));
  this.wsServer_.on('error', this.onWsError.bind(this));
}

//
// Inherit from EventProcessor, and load Websocket and HTTP event handlers as
// sub classes in the prototype.
//
_.extend(HttpServer.prototype, require('./handlers'));
_.extend(HttpServer.prototype, require('./actions'));
util.inherits(HttpServer, EventProcessor);

HttpServer.prototype.$schema = require('./HttpServer.schema.js');

// Starts the HTTP server listening on its port.
HttpServer.prototype.listen = function(cb) {
  assert(this.isHttpServer());
  assert(arguments.length === 1);

  var server = this.httpServer_;
  var config = this.config_;
  var emitFn = this.emit.bind(this);

  if (server.listening) {
    var err = new Error('Server is already listening.');
    emitFn('server_error', err);
    return cb(err);
  }

  this.httpServer_.listen(config.server.port, config.server.address, (function(err) {
    if (err) {
      emitFn('server_error', err);
      return cb(new Error(fmt(
          'Cannot listen on %s:%s, reason=%s',
          config.server.address, config.server.port, err.message)));
    }
    var endpoints = this.getEndpoints();
    emitFn('server_listening');
    return cb(null, endpoints);
  }).bind(this));
};



//
// Stops a listening HttpServer, instructing all listening clients to reconnect.
// This is useful for unit tests, but not particularly in a daemon.
//
HttpServer.prototype.close = HttpServer.prototype.stop = function(cb) {
  assert(this.isHttpServer());
  assert(arguments.length === 1);
  var httpServer = this.httpServer_;
  if (httpServer.listening) {
    this.wsServer_.close();
    return httpServer.close(cb);
  }
  return cb();
};


//
// Sanity check for dynamic binding.
//
HttpServer.prototype.isHttpServer = function() {
  if (this instanceof HttpServer) {
    return this;
  }
};


//
// For a listening server, get LAN URLs for listening HTTP endpoints. This is
// useful in development with `address` specified as `0.0.0.0` (standard Unix
// constant that means "all network interfaces").
//
HttpServer.prototype.getEndpoints = function() {
  // Get listening port from base HTTP server.
  var config = this.config_;
  var listenAddress = this.httpServer_.address();
  var address = listenAddress.address;
  var port = listenAddress.port;

  // Get list of network interfaces from system.
  var netInterfaces = os.networkInterfaces();

  // Generate an endpoint for each network interface.
  var endpoints = _.filter(_.flatten(_.map(netInterfaces, function(
      ifAddrList, ifName) {
    return _.map(ifAddrList, function(ifAddr) {
      var url = fmt('http://%s:%s/', ifAddr.address, port);
      var wsUrl = fmt(
          'ws://%s:%s/__bs__/live', ifAddr.address, port);
      if (ifAddr.family === 'IPv4') {
        return {
          interface: ifName,
          url: url,
          address: ifAddr.address,
          port: port,
          wsUrl: wsUrl,
        };
      }
    });
  })));

  // If a specific network address is specified, filter the rest out.
  if (config.server.address !== '0.0.0.0') {
    // A specific address was specified in the config.
    endpoints = _.filter(endpoints, function(ep) {
      return ep.address === address;
    });
  }

  return endpoints;
};


module.exports = HttpServer;
