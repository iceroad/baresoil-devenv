const _ = require('lodash'),
  assert = require('assert'),
  async = require('async'),
  streamBuffers = require('stream-buffers'),
  tar = require('tar-fs'),
  zlib = require('zlib')
  ;


exports.makeArchive = function makeArchive(path, cb) {
  async.auto({
    tarball(cb) {
      const tarballStream = new streamBuffers.WritableStreamBuffer();
      const packOptions = {
        dereference: true,
      };
      tar.pack(path, packOptions).on('end', () => {
        return cb(null, tarballStream.getContents());
      }).pipe(tarballStream);
    },
    gzipped: ['tarball', (deps, cb) => {
      return zlib.gzip(deps.tarball, cb);
    }],
  }, (err, results) => {
    if (err) return cb(err);
    return cb(null, results.gzipped);
  });
};


exports.extractArchive = function extractArchive(outPath, arData, cb) {
  assert(_.isString(outPath));
  assert(Buffer.isBuffer(arData));
  assert(_.isFunction(cb));

  async.auto({
    tarball(cb) {
      return zlib.gunzip(arData, cb);
    },
    extracted: ['tarball', (deps, cb) => {
      const tarballStream = new streamBuffers.ReadableStreamBuffer({
        frequency: 10,          // in milliseconds.
        chunkSize: 64 * 1024,    // in bytes.
      });
      const extractStream = tar.extract(outPath, {
        dmode: 0o555, // all dirs should be readable
        fmode: 0o444, // all files should be readable
      });
      extractStream.on('finish', () => cb());
      tarballStream.pipe(extractStream);
      tarballStream.put(deps.tarball);
      tarballStream.stop();
    }],
  }, err => cb(err));
};
