const assert = require('assert');

module.exports = function HubProjectError(projectError) {
  assert(this.isHub());
  console.error(`Project error: ${JSON.stringify(projectError)}`);
};
