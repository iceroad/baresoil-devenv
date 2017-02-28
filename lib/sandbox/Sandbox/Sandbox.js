
var _ = require('lodash')
  , assert = require('assert')
  , os = require('os')
  , path = require('path')
  , states = require('./states')
  , util = require('util')
  , EventEmitter = require('events')
  , JSONSieve = require('./json-sieve')
  , EventProcessor = require('../../util/EventProcessor')
  ;

var KILOBYTES = 1024;

/**
 * Sandboxed child process.
 *
 * @constructor
 * @param {?SandboxOptions} config
 */
function Sandbox(config) {
  EventProcessor.call(this);
  this.config_ = config;
  this.outbox_ = [];  // buffer messages till child starts
  this.logs = {
    stdout: '',
    stderr: '',
  };

  // Pick out LD-JSON lines from the child's stdout.
  this.sieve_ = new JSONSieve();  // Line-buffer for sandbox stdout.
  this.sieve_.on('json_array', this.onSandboxMessage.bind(this));
  this.sieve_.on('stdout_line', this.onSandboxStdout.bind(this));
}

_.extend(Sandbox.prototype, require('./actions'));
_.extend(Sandbox.prototype, require('./handlers'));
util.inherits(Sandbox, EventProcessor);
Sandbox.prototype.$schema = require('./Sandbox.schema');


Sandbox.prototype.isSandbox = function() {
  if (this instanceof Sandbox) {
    return this;
  }
};


Sandbox.prototype.isRunning = function() {
  assert(this.isSandbox());
  return this.state_ === states.RUNNING;
};

module.exports = Sandbox;
