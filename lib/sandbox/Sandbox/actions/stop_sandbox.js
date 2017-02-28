var _ = require('lodash')
  , assert = require('assert')
  , json = JSON.stringify
  , states = require('../states')
  ;


module.exports = function() {
  assert(this.isSandbox());
  if (!this.status_) return;  // Sandbox has not started.
  if (this.status_ === states.EXITED) return;  // Sandbox is dead.
  if (this.status_ === states.SHUTDOWN) return;  // Sandbox is shutting down.

  if (this.status_ === states.RUNNING) {
    // Signal the child.
    try {
      this.child_.stdin.write(json(['shutdown']) + '\n', 'utf-8');
    } catch(e) {
      // Cannot signal the child, proceed to force kill.
    }
  }

  this.status_ = states.SHUTDOWN;

  _.delay(function() {
    if (this.child_) {
      this.child_.kill();
    }
  }.bind(this), 500);
};

