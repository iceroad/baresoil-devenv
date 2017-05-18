const _ = require('lodash'),
  assert = require('assert'),
  col = require('colors'),
  fmt = require('util').format
  ;


module.exports = function HubSandboxStderr(baseConnection, stderrData) {
  assert(this.isHub());
  const stderrLines = stderrData.split('\n');
  const shortClientId = fmt('[%s]', baseConnection.clientId.substr(0, 6));

  _.forEach(stderrLines, (line) => {
    console.error('%s sandbox:stderr: '.red + _.toString(line).gray, shortClientId);
  });
};

