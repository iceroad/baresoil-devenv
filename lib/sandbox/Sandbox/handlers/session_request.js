var assert = require('assert');

module.exports = function(sessionRequestArg) {
  assert(this.isSandbox());
  var msg = JSON.stringify(['session_request', sessionRequestArg]) + '\n';
  if (this.child_) {
    try {
      this.child_.stdin.write(msg, 'utf-8');
      return;
    } catch(e) { }
  }

  this.outbox_.push(msg);
};
