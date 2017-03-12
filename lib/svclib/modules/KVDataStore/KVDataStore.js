var _ = require('lodash')
  , assert = require('assert')
  , fs = require('fs')
  , fse = require('fs-extra')
  , json = JSON.stringify
  , path = require('path')
  ;


function KVDataStore(config) {
  this.config_ = config;
}


KVDataStore.prototype.start = function(svclib, cb) {
  assert(this.isKVDataStore());
  assert(!this.started_, 'start() called more than once.');

  this.kvMap_ = {}            // holds tables of key/value pairs
  this.kvMapDirty_ = false;   // data in kvMap needs to be flushed to disk.
  this.started_ = true;

  // Attempt to restore serialized kvMap from disk.
  var serPath = path.join(this.config_.dev.data_root, 'KVDataStore.json');
  try {
    if (fs.existsSync(serPath)) {
      this.kvMap_ = JSON.parse(fs.readFileSync(serPath, 'utf-8'));
    }
  } catch(e) { return cb(e); }
  fse.ensureDirSync(path.dirname(serPath));

  // Periodically flush kvMap_ to disk.
  var flushFreqMs = this.config_.dev.fs_flush_frequency_ms;
  var flusher = function() {
    this.flush(function(err) {
      this.flushTimeout_ = setTimeout(flusher, flushFreqMs);
    }.bind(this));
  }.bind(this);
  flusher();

  return cb();
};


KVDataStore.prototype.stop = function(cb) {
  assert(this.isKVDataStore());
  assert(this.started_, 'start() not called.');
  if (this.flushTimeout_) {
    clearTimeout(this.flushTimeout_);
    delete this.flushTimeout_;
  }
  return this.flush(cb);
};


KVDataStore.prototype.flush = function(cb) {
  assert(this.isKVDataStore());
  assert(this.started_, 'start() not called.');

  if (this.kvMapFlushInProgress_ || !this.kvMapDirty_) {
    return cb();
  }

  // Save serialized kvMap to disk.
  var serPath = path.join(this.config_.dev.data_root, 'KVDataStore.json');
  var serData = json(this.kvMap_, null, 2);
  this.kvMapFlushInProgress_ = true;
  fs.writeFile(serPath, serData, 'utf-8', function(err) {
    if (err) return cb(err);
    assert(this.isKVDataStore());
    this.kvMapDirty_ = false;
    delete this.kvMapFlushInProgress_;
    return cb();
  }.bind(this));
};


KVDataStore.prototype.isKVDataStore = function() {
  if (this instanceof KVDataStore) {
    return this;
  }
};


KVDataStore.prototype.$functions = require('./functions');
KVDataStore.prototype.$types = require('./types');


module.exports = KVDataStore;
