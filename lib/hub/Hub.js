var _ = require('lodash')
  , assert = require('assert')
  , async = require('async')
  , os = require('os')
  , path = require('path')
  , util = require('util')
  , DevHelper = require('../dev/DevHelper')
  , EventProcessor = require('../util/EventProcessor')
  , HttpServer = require('../server/HttpServer')
  , Svclib = require('../svclib/Svclib')
  ;


function Hub(config) {
  EventProcessor.call(this);
  this.config_ = config;

  // Accept messages from HTTP server.
  var server = this.server_ = new HttpServer(config);
  this.acceptFrom(server, 'ws_connection_started');
  this.acceptFrom(server, 'ws_connection_ended');
  this.acceptFrom(server, 'ws_message_incoming');
  this.acceptFrom(server, 'http_request_incoming');
  this.acceptFrom(server, 'server_listening');

  // Accept messages from Svclib.
  var svclib = this.svclib_ = new Svclib(config);
  this.acceptFrom(svclib, 'svclib_interface');
  this.acceptFrom(svclib, 'svclib_response');
  this.acceptFrom(svclib, 'svclib_event');

  // Accept messages from DevHelper.
  var devHelper = this.devHelper_ = new DevHelper(config, server);
  this.acceptFrom(devHelper, 'http_send_response');
  this.acceptFrom(devHelper, 'server_package');
  this.acceptFrom(devHelper, 'project_error');

  // Global data structures.
  this.clients_ = {};
}


util.inherits(Hub, EventProcessor);
_.extend(Hub.prototype, require('./actions'));
Hub.prototype.$schema = require('./Hub.schema');
Hub.prototype.log = require('./log');


Hub.prototype.acceptFrom = function(modRef, evtName) {
  var hub = this;
  var prefixArgs = Array.prototype.slice.call(arguments, 1);
  modRef.on(evtName, function() {
    var args = Array.prototype.slice.call(arguments);
    hub.accept.apply(hub, _.cloneDeep(_.concat(prefixArgs, args)));
  });
}


Hub.prototype.start = function(cb) {
  return async.series([
    // Start the service library.
    this.svclib_.start.bind(this.svclib_),

    // Wait for "svclib_interface" before continuing.
    function(cb) {
      if (this.svclibInterface_) {
        return cb();
      }
      this.svclib_.once('svclib_interface', function() {
        return cb();
      });
    }.bind(this),

    // Start development helper.
    this.devHelper_.start.bind(this.devHelper_),

    // Wait for "server_package" before continuing.
    function(cb) {
      if (this.serverPackage_) {
        return cb();
      }
      this.devHelper_.once('server_package', function() {
        return cb();
      });
    }.bind(this),

    // Start HTTP server.
    this.server_.listen.bind(this.server_),
  ], cb);
};


Hub.prototype.stop = function(cb) {
  return async.series([
      this.server_.stop.bind(this.server_),
      this.devHelper_.stop.bind(this.devHelper_),
      this.svclib_.stop.bind(this.svclib_),
    ], cb);
};


Hub.prototype.isHub = function() {
  if (this instanceof Hub) {
    return this;
  }
}


Hub.prototype.getClients = function() {
  return this.clients_;
}


Hub.prototype.getEndpoints = function() {
  return this.server_.getEndpoints();
};

module.exports = Hub;
