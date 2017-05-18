const assert = require('assert');

module.exports = function onSandboxStderr(stderrData) {
  assert(this.isSandbox());
  const stderrStr = stderrData.toString('utf-8');

  this.logs.stderr += stderrStr;
  const logLength = this.logs.stderr.length;
  if (logLength > this.config_.maxLogLengthBytes) {
    const deleteChars = this.config_.maxLogLengthBytes - logLength;
    this.logs.stderr.splice(0, deleteChars);
  }

  this.emit('sandbox_stderr', stderrStr);
};
