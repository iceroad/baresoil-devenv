const _ = require('lodash'),
  assert = require('assert'),
  states = require('./states'),
  AcceptHandlers = require('./handlers'),
  EventIO = require('event-io'),
  JSONSieve = require('../../util/json-sieve'),
  Schema = require('./Sandbox.schema'),
  TypeLibrary = require('../../types')
  ;


class Sandbox extends EventIO {
  constructor(config) {
    super();
    this.config_ = config;
    this.outbox_ = [];  // buffer messages till child starts
    this.logs = {
      stdout: '',
      stderr: '',
    };

    // Set up EventIO.
    this.setAcceptHandlers(AcceptHandlers);
    this.extendTypeLibrary(TypeLibrary);
    this.$schema = Schema;

    // Pick out LD-JSON lines from the child's stdout.
    this.sieve_ = new JSONSieve();  // Line-buffer for sandbox stdout.
    this.sieve_.on('json_array', this.onSandboxMessage.bind(this));
    this.sieve_.on('stdout_line', this.onSandboxStdout.bind(this));
  }

  isSandbox() {
    if (this instanceof Sandbox) {
      return this;
    }
  }

  isRunning() {
    assert(this.isSandbox());
    return this.state_ === states.RUNNING;
  }
}

_.extend(Sandbox.prototype, require('./methods'));

Sandbox.prototype.$schema = Schema;

module.exports = Sandbox;
