// SandboxDriver
//
// This module exports a class called `SandboxDriver`, a singleton instance of
// which is becomes the `this` context object of server-side handler functions.
//
var _ = require('lodash')
  , assert = require('assert')
  , fmt = require('util').format
  , fs = require('fs')
  , json = JSON.stringify
  , path = require('path')
  , types = require('runtype').library
  , util = require('util')
  , EventProcessor = require('./EventProcessor')
  ;


//
// Constructor.
//
function SandboxDriver() {
  EventProcessor.call(this);
  this.baseConnection = JSON.parse(process.env.BASE_CONNECTION);
  this.handlers = {};
  var callbacks = this.svclibCallbacks_ = {};

  // Generate stubs for the service library.
  var svclibInterface = JSON.parse(process.env.SVCLIB_INTERFACE);
  var nextRequestId = 1;
  var emitFn = this.emit.bind(this);
  this.svclib = _.mapValues(svclibInterface, function(svcDef, svcName) {
    return _.mapValues(svcDef, function(trueVal, fnName) {
      return function() {
        var args = Array.prototype.slice.call(arguments);
        assert(_.isFunction(_.last(args)), 'Last argument must be a callback.');
        assert(args.length === 2, 'Must be called with exactly 2 arguments.');

        var svclibRequest = {
          requestId: ++nextRequestId,
          service: svcName,
          function: fnName,
          arguments: args[0],
        };

        var cb = args[args.length - 1];
        callbacks[svclibRequest.requestId] = cb;

        emitFn('svclib_request', svclibRequest);
      };
    });
  });
}

_.extend(SandboxDriver.prototype, require('./actions'));
util.inherits(SandboxDriver, EventProcessor);


SandboxDriver.prototype.sendEvent = function(evtName, evtData) {
  this.emit('user_event', {
    name: evtName,
    data: evtData,
  });
};


SandboxDriver.prototype.isSandboxDriver = function() {
  if (this instanceof SandboxDriver) {
    return this;
  }
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
SandboxDriver.prototype.loadHandlers = function(dirPath) {
  var dirListing = _.sortBy(fs.readdirSync(dirPath));
  var handlerMap = _.fromPairs(_.filter(_.map(dirListing, function(fnName) {
    if (fnName.match(/^fn-[a-z0-9_\-\$]+\.js$/i)) {
      var bareFnName = fnName.substr(3, fnName.length - 6);
      return [bareFnName, require(path.join(dirPath, fnName))];
    }
  })));
  if (_.isEmpty(handlerMap)) {
    throw new Error('No handlers found in directory ' + dirPath);
  }
  _.merge(this.handlers, handlerMap);
};


SandboxDriver.prototype.$schema = require('./SandboxDriver.schema');


module.exports = SandboxDriver;
