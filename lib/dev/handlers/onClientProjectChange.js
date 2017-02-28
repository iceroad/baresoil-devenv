var _ = require('lodash')
  , assert = require('assert')
  ;


module.exports = function(clientDirectory) {
  assert(this.isDevHelper());
  this.emit('client_project_changed');
}
