var assert = require('assert');

module.exports = function(svclibEvent) {
  assert(this.isSandboxDriver());
  var svclibMod = this.svclib[svclibEvent.service];
  if (svclibMod) {
    svclibMod.emit(svclibEvent.name, svclibEvent.data);
  }
};
