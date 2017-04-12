var _ = require('lodash')
  , assert = require('assert')
  , col = require('colors')
  , fmt = require('util').format
  ;


module.exports = function(baseConnection, stderrData) {
  assert(this.isHub());
  var stderrLines = stderrData.split('\n');
  var shortClientId = fmt('[%s]', baseConnection.clientId.substr(0, 6));
  _.forEach(stderrLines, (line) => {
    console.error('%s sandbox:stderr: '.red + _.toString(line).gray, shortClientId);
  });
};

