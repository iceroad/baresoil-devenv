var assert = require('assert');

module.exports = function(stderrData) {
  assert(this.isSandbox());
  var stderrStr = stderrData.toString('utf-8');

  this.logs.stderr += stderrStr;
  var logLength = this.logs.stderr.length;
  if (logLength > this.config_.maxLogLengthBytes) {
    var deleteChars = this.config_.maxLogLengthBytes - logLength;
    this.logs.stderr.splice(0, deleteChars);
  }

  this.emit('sandbox_stderr', stderrStr);
};
