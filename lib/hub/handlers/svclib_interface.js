const assert = require('assert');


module.exports = function HubSvclibInterface(svclibInterface) {
  assert(this.isHub());
  this.svclibInterface_ = svclibInterface;
};
