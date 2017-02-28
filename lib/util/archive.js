var _ = require('lodash')
  , assert = require('assert')
  , async = require('async')
  , path = require('path')
  , streamBuffers = require('stream-buffers')
  , tar = require('tar-fs')
  , zlib = require('zlib')
  ;


exports.makeArchive = function(path, cb) {
  async.auto({
    tarball: function(cb) {
      var tarballStream = new streamBuffers.WritableStreamBuffer();
      var packOptions = {
        dereference: true,
      };
      tar.pack(path, packOptions).on('end', function () {
        return cb(null, tarballStream.getContents());
      }).pipe(tarballStream);
    },
    gzipped: ['tarball', function(deps, cb) {
      return zlib.gzip(deps.tarball, cb);
    }],
  }, function(err, results) {
    if (err) return cb(err);
    return cb(null, results.gzipped);
  });
};


exports.extractArchive = function(outPath, arData, cb) {
  assert(_.isString(outPath));
  assert(Buffer.isBuffer(arData));
  assert(_.isFunction(cb));

  async.auto({
    tarball: function(cb) {
      return zlib.gunzip(arData, cb);
    },
    extracted: ['tarball', function(deps, cb) {
      var tarballStream = new streamBuffers.ReadableStreamBuffer({
        frequency: 10,          // in milliseconds.
        chunkSize: 64 * 1024    // in bytes.
      });
      var extractStream = tar.extract(outPath, {
        dmode: parseInt(555, 8), // all dirs should be readable
        fmode: parseInt(444, 8) // all files should be readable
      });
      extractStream.on('finish', function() {
        return cb();
      });
      tarballStream.pipe(extractStream);
      tarballStream.put(deps.tarball);
      tarballStream.stop();
    }],
  }, function(err) {
    if (err) return cb(err);
    return cb();
  });
}
