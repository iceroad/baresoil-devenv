var assert = require('assert');

module.exports = function(svclibEvent) {
  assert(this.isSandboxDriver());
  var svclibMod = this.svclib[svclibEvent.module];
  if (svclibMod) {
    svclibMod.emit(svclibEvent.name, svclibEvent.data);
  }
};
