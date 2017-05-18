var assert = require('assert');


module.exports = function(stdoutLine) {
  assert(this.isSandbox());

  // Drop terminating newline.
  stdoutLine = stdoutLine.replace(/[\r\n]+$/, '');

  this.logs.stdout += stdoutLine;
  var logLength = this.logs.stdout.length;
  if (logLength > this.config_.maxLogLengthBytes) {
    var deleteChars = this.config_.maxLogLengthBytes - logLength;
    this.logs.stdout.splice(0, deleteChars);
  }

  this.emit('sandbox_stdout', stdoutLine);
};
