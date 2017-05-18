// SandboxDriver
//
// This module exports a class called `SandboxDriver`, a singleton instance of
// which is becomes the `this` context object of server-side handler functions.
//
const _ = require('lodash'),
  assert = require('assert'),
  fs = require('fs'),
  path = require('path'),
  AcceptHandlers = require('./handlers'),
  EventIO = require('event-io'),
  EventEmitter = require('events'),
  Schema = require('./SandboxDriver.schema'),
  TypeLibrary = require('./types')
  ;


class SandboxDriver extends EventIO {
  constructor(baseConnection, svclibInterface) {
    super();
    this.handlers = {};  // user's handlers, to be populated later.
    this.baseConnection = baseConnection;
    const callbacks = this.svclibCallbacks_ = {};

    // Set up EventIO.
    this.setAcceptHandlers(AcceptHandlers);
    this.extendTypeLibrary(TypeLibrary);
    this.$schema = Schema;

    // Generate stubs for the service library.
    let nextRequestId = 1;
    /* eslint-disable arrow-body-style */
    this.svclib = _.mapValues(svclibInterface, (svcDef, svcName) => {
      return _.mapValues(svcDef, (ignored, fnName) => {
        return (...args) => {
          // Extract callback to save.
          assert(_.isFunction(_.last(args)), 'Require a callback.');
          const cb = _.last(args);
          args.splice(args.length - 1, 1);

          const svclibRequest = {
            requestId: ++nextRequestId,
            service: svcName,
            function: fnName,
            arguments: args,
          };
          callbacks[svclibRequest.requestId] = cb;

          this.emit('svclib_request', svclibRequest);
        };
      });
    });

      // Make all svclib modules EventEmitters.
    _.forEach(this.svclib, (svcDef) => {
      const emitter = new EventEmitter();
      _.extend(svcDef, emitter);
    });
  }

  sendEvent(evtName, evtData) {
    assert(_.isString(evtName), 'require a string event name.');
    this.emit('user_event', {
      name: evtName,
      data: evtData,
    });
  }

  isSandboxDriver() {
    return true;
  }

  //
  // Loads handler functions from a folder on disk using vanilla node.js
  // require(). Handler functions are identified by their filenames, which must
  // be in the format 'fn-<handler_name>.js'.
  //
  // Handler names cannot contain spaces or characters other than alphanumeric
  // with dashes and underscores.
  //
  // Handlers that starts with a dollar sign are for special system events.
  //
  loadHandlers(dirPath) {
    const dirListing = _.sortBy(fs.readdirSync(dirPath));
    const handlerMap = _.fromPairs(_.filter(_.map(dirListing, (fnName) => {
      if (fnName.match(/^fn-[a-z0-9_\-$]+\.js$/i)) {
        const bareFnName = fnName.substr(3, fnName.length - 6);
        /* eslint-disable global-require, import/no-dynamic-require */
        return [bareFnName, require(path.join(dirPath, fnName))];
      }
    })));
    if (_.isEmpty(handlerMap)) {
      throw new Error(`No handlers found in directory ${dirPath}`);
    }
    _.merge(this.handlers, handlerMap);
  }
}

module.exports = SandboxDriver;
