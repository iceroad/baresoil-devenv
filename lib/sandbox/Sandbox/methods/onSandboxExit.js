const assert = require('assert'),
  fse = require('fs-extra'),
  states = require('../states')
  ;

module.exports = function onSandboxExit(code, signal) {
  assert(this.isSandbox());

  const wd = this.wd_;
  this.state_ = states.SHUTDOWN;

  fse.remove(wd, () => {
    return this.emit('sandbox_exited', {
      code,
      signal,
      stderr: this.logs.stderr,
      stdout: this.logs.stdout,
    });
  });
};
