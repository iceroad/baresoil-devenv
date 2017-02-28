var _ = require('lodash')
  , fs = require('fs')
  , library = require('./library')
  , path = require('path')
  ;


function loadFromDisk(diskPath) {
  var fileList = _.filter(fs.readdirSync(diskPath), function(fname) {
    return fname.match(/\.js$/i);
  });
  _.extend(library, _.fromPairs(_.map(fileList, function(fname) {
    var typeName = fname.replace(/\.js$/i, '');
    return [typeName, require(path.join(diskPath, fname))];
  })));
}

module.exports = loadFromDisk;
