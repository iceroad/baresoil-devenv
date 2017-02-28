var _ = require('lodash')
  , fs = require('fs')
  , loadFromDisk = require('runtype').loadFromDisk
  , library = require('runtype').library
  , path = require('path')
  ;


module.exports = function() {
  var coreTypesDir = path.join(__dirname, 'core');
  loadFromDisk(coreTypesDir);

  var sbDriverTypeDir = path.join(__dirname, '../sandbox/SandboxDriver/types');
  loadFromDisk(sbDriverTypeDir);

  var svclibTypes = _.flatten(_.map(require('../svclib/modules'), function(modConstructor) {
    return _.toPairs(modConstructor.prototype.$types);
  }));

  _.extend(library, _.fromPairs(svclibTypes));
};
