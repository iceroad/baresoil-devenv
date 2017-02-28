var assert = require('assert');

module.exports = function(projectError) {
  assert(this.isHub());
  this.emit('project_error', projectError);
};

