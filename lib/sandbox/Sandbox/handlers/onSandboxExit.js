var _ = require('lodash')
  , assert = require('assert')
  , fse = require('fs-extra')
  , states = require('../states')
  ;

module.exports = function(code, signal) {
  assert(this.isSandbox());

  var wd = this.wd_;
  this.state_ = states.SHUTDOWN;

  fse.remove(wd, function(err) {
    return this.emit('sandbox_exited', {
      code: code,
      signal: signal,
      stderr: this.logs.stderr,
      stdout: this.logs.stdout,
    });
  }.bind(this));
}
