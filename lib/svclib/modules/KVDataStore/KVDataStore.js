const _ = require('lodash'),
  assert = require('assert'),
  fs = require('fs'),
  fse = require('fs-extra'),
  json = JSON.stringify,
  path = require('path')
  ;


class KVDataStore {
  constructor(config) {
    this.config_ = config;
  }


  start(cb) {
    assert(this.isKVDataStore());
    assert(!this.started_, 'start() called more than once.');

    this.kvMap_ = {};            // holds tables of key/value pairs
    this.kvMapDirty_ = false;   // data in kvMap needs to be flushed to disk.
    this.started_ = true;

    // Attempt to restore serialized kvMap from disk.
    const serPath = path.join(this.config_.dev.data_root, 'KVDataStore.json');
    try {
      if (fs.existsSync(serPath)) {
        this.kvMap_ = JSON.parse(fs.readFileSync(serPath, 'utf-8'));
      }
    } catch (e) { return cb(e); }
    fse.ensureDirSync(path.dirname(serPath));

    // Periodically flush kvMap_ to disk.
    const flushFreqMs = this.config_.dev.fs_flush_frequency_ms;
    const flusher = () => {
      this.flush(() => {
        this.flushTimeout_ = setTimeout(flusher, flushFreqMs);
      });
    };

    flusher();
    _.defer(cb);
  }


  genStartWithDeps() {
    assert(this.isKVDataStore());
    return [this.start.bind(this)];
  }


  genStopWithDeps() {
    assert(this.isKVDataStore());
    return [this.stop.bind(this)];
  }


  stop(cb) {
    assert(this.isKVDataStore());
    assert(this.started_, 'start() not called.');
    if (this.flushTimeout_) {
      clearTimeout(this.flushTimeout_);
      delete this.flushTimeout_;
    }
    return this.flush(cb);
  }


  flush(cb) {
    assert(this.isKVDataStore());
    assert(this.started_, 'start() not called.');

    if (this.kvMapFlushInProgress_ || !this.kvMapDirty_) {
      return cb();
    }

    // Save serialized kvMap to disk.
    const serPath = path.join(this.config_.dev.data_root, 'KVDataStore.json');
    const serData = json(this.kvMap_, null, 2);
    this.kvMapFlushInProgress_ = true;
    fs.writeFile(serPath, serData, 'utf-8', (err) => {
      if (err) return cb(err);
      assert(this.isKVDataStore());
      this.kvMapDirty_ = false;
      delete this.kvMapFlushInProgress_;
      _.defer(cb);
    });
  }


  isKVDataStore() {
    if (this instanceof KVDataStore) {
      return this;
    }
  }
}


KVDataStore.prototype.$functions = require('./functions');


module.exports = KVDataStore;
