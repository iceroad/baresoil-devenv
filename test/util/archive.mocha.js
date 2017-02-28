var _ = require('lodash')
  , archive = require('../../lib/util/archive')
  , assert = require('chai').assert
  , async = require('async')
  , fmt = require('util').format
  , fs = require('fs')
  , path = require('path')
  , temp = require('temp').track()
  ;


describe('Utilities: archive', function() {

  it('create and extract archives', function(cb) {
    var testPath = path.join(__dirname, 'test_tree');
    var pkgBuffer;

    return async.series([
      function(cb) {
        archive.makeArchive(testPath, function(err, package) {
          assert.isNotOk(err);
          assert(Buffer.isBuffer(package));
          assert.isAbove(package.length, 100);
          pkgBuffer = package;
          return cb();
        });
      },

      function(cb) {
        var tempDir = temp.mkdirSync();
        archive.extractArchive(tempDir, pkgBuffer, function(err) {
          assert.isNotOk(err);
          var treeTop = fs.readdirSync(tempDir);
          assert.deepEqual(treeTop, [
            'sample-1.txt',
            'subfolder-1']);
          return cb();
        });
      },
    ], cb);
  });

});
