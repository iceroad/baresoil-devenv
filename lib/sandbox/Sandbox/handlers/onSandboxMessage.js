var _ = require('lodash')
  , assert = require('assert')
  , fmt = require('util').format
  , states = require('../states')
  ;


function onSandboxMessage(jsonArray) {
  assert(this.isSandbox());

  var cmd = jsonArray[0];
  var payload = jsonArray[1];

  if (cmd === 'sandbox_started') {
    this.status_ = states.RUNNING;

    // Write outbox contents.
    if (this.outbox_.length) {
      _.forEach(this.outbox_, function(msg) {
        try {
          this.child_.stdin.write(msg, 'utf-8');
        } catch (e) { }
      }.bind(this));
      this.outbox_ = [];
    }
  }

  if (cmd === 'shutdown') {
    this.status_ = states.SHUTDOWN;
    return;
  }

  if (cmd === 'sandbox_started' ||
      cmd === 'rpc_response' ||
      cmd === 'session_response' ||
      cmd === 'svclib_request' ||
      cmd === 'user_event') {
    return this.emit.apply(this, jsonArray);
  }

  this.onSandboxStderr(fmt(
      'Baresoil Runtime: unknown command "%s" requested.',
        JSON.stringify(jsonArray)));
};

module.exports = onSandboxMessage;
