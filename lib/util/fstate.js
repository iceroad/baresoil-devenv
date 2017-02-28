var _ = require('lodash')
  , fmt = require('util').format
  , path = require('path')
  , walk = require('walk')
  ;


function fstate(dir, cb) {
  var files = [];
  var errors = [];
  var walker = walk.walk(dir, {
    followLinks: true,
  });

  walker.on('file', function(root, fileStat, next) {
    // Filter out files in the source tree.
    if (fileStat.name[0] != '.' &&        // no hidden files
        fileStat.type == 'file') {        // only files
      // Assemble return structure.
      var absPath = path.join(root, fileStat.name);
      var relPath = path.relative(dir, absPath);
      files.push({
        absPath: absPath,
        relPath: relPath,
        size: fileStat.size,
        mtime: fileStat.mtime,
        name: fileStat.name,
      });
    }
    return next();
  });

  walker.on('errors', function(root, nodeStatsArray, next) {
    var firstErr = nodeStatsArray[0];
    errors.push(fmt(
      'File: %s, Error: "%s"',
      firstErr.error.path, firstErr.error.code));
    return next();
  });

  walker.once('end', function() {
    return cb(null, _.sortBy(files, 'absPath'), errors);
  });
}


module.exports = fstate;
