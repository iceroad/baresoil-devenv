var _ = require('lodash')
  , assert = require('assert')
  ;


module.exports = function(svclibInterface) {
  assert(this.isHub());
  this.svclibInterface_ = svclibInterface;
};

