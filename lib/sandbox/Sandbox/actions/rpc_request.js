var assert = require('assert');

module.exports = function(rpcRequest) {
  assert(this.isSandbox());
  var msg = JSON.stringify(['rpc_request', rpcRequest]) + '\n';
  if (this.child_) {
    this.child_.stdin.write(msg, 'utf-8');
  } else {
    this.outbox_.push(msg);
  }
};
