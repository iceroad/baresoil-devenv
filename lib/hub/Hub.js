const _ = require('lodash'),
  assert = require('assert'),
  async = require('async'),
  AcceptHandlers = require('./handlers'),
  DevHelper = require('../dev/DevHelper'),
  EventIO = require('event-io'),
  HttpServer = require('../server/HttpServer'),
  Schema = require('./Hub.schema'),
  Svclib = require('../svclib/Svclib'),
  TypeLibrary = require('../types')
  ;


class Hub extends EventIO {
  constructor(config) {
    super();
    this.config_ = config;

    // Set up EventIO.
    this.setAcceptHandlers(AcceptHandlers);
    this.extendTypeLibrary(TypeLibrary);
    this.$schema = Schema;

    // Accept messages from HTTP server.
    const server = this.server_ = new HttpServer(config);
    this.acceptFrom(server, 'ws_connection_started');
    this.acceptFrom(server, 'ws_connection_ended');
    this.acceptFrom(server, 'ws_message_incoming');
    this.acceptFrom(server, 'http_request_incoming');
    this.acceptFrom(server, 'server_listening');

    // Accept messages from Svclib.
    const svclib = this.svclib_ = new Svclib(config);
    this.acceptFrom(svclib, 'svclib_interface');
    this.acceptFrom(svclib, 'svclib_response');
    this.acceptFrom(svclib, 'svclib_event');

    // Accept messages from DevHelper.
    const devHelper = this.devHelper_ = new DevHelper(config, server);
    this.acceptFrom(devHelper, 'http_send_response');
    this.acceptFrom(devHelper, 'server_package');
    this.acceptFrom(devHelper, 'project_error');

    // Global data structures.
    this.clients_ = {};
  }

  start(cb) {
    assert(this.isHub());
    return async.series([
      // Start the service library.
      this.svclib_.start.bind(this.svclib_),

      // Wait for "svclib_interface" before continuing.
      (cb) => {
        if (this.svclibInterface_) {
          return cb();
        }
        this.log('arse');
        this.svclib_.once('svclib_interface', () => cb());
      },

      // Start development helper.
      this.devHelper_.start.bind(this.devHelper_),

      // Wait for "server_package" before continuing.
      (cb) => {
        if (this.serverPackage_) {
          return cb();
        }
        this.devHelper_.once('server_package', () => cb());
      },

      // Start HTTP server.
      this.server_.listen.bind(this.server_),
    ], cb);
  }

  stop(cb) {
    assert(this.isHub());
    return async.series([
      this.server_.close.bind(this.server_),
      this.devHelper_.stop.bind(this.devHelper_),
      this.svclib_.stop.bind(this.svclib_),
    ], cb);
  }

  isHub() {
    if (this instanceof Hub) {
      return this;
    }
  }

  acceptFrom(modRef, evtName, ...prefixArgs) {
    const hub = this;
    modRef.on(evtName, (...evtArgs) => {
      hub.accept(..._.concat([evtName], prefixArgs, evtArgs));
    });
  }

  getClients() {
    assert(this.isHub());
    return this.clients_;
  }

  getEndpoints() {
    assert(this.isHub());
    return this.server_.getEndpoints();
  }
}


Hub.prototype.log = require('./log');


module.exports = Hub;
