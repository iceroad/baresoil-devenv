var _ = require('lodash')
  , assert = require('chai').assert
  , async = require('async')
  , crypto = require('crypto')
  , fmt = require('util').format
  , json = JSON.stringify
  , Harness = require('./Harness')
  ;


describe('KVDataStore: ' + 'set() and get()'.cyan, function() {
  var harness = new Harness();

  this.slow(500);

  before(function(cb) {
    return harness.init(cb);
  });

  beforeEach(function(cb) {
    return harness.beforeEach(cb);
  });

  afterEach(function(cb) {
    return harness.afterEach(cb);
  });

  it('should correctly set-then-get a single key' , function(cb) {
    return async.series([
      // First call set().
      function(cb) {
        return harness.SvclibRequest('KVDataStore', 'set', [
          {
            table: 'unit_test',
            key: harness.testKey,
            value: harness.testValue,
          },
        ], function(err, items) {
          // Ensure set() returned without error.
          assert.isNotOk(err);
          assert.equal(items.length, 1);
          assert.isTrue(items[0].exists);
          return cb();
        });
      },

      // Then call get() on the same key.
      function(cb) {
        return harness.SvclibRequest('KVDataStore', 'get', [
          {
            table: 'unit_test',
            key: harness.testKey,
          },
        ], function(err, items) {
          // Ensure get() returned original value
          assert.isNotOk(err);
          assert.equal(items.length, 1);
          var kvPair = items[0];
          assert.isTrue(kvPair.exists);
          assert.strictEqual(kvPair.value, harness.testValue);
          return cb();
        });
      },
    ], cb);
  });


  it('should not return expired keys', function(cb) {
    return async.series([
      // First call set().
      function(cb) {
        return harness.SvclibRequest('KVDataStore', 'set', [
          {
            table: 'unit_test',
            key: harness.testKey,
            value: harness.testValue,
            expires: Date.now() + 1,
          },
        ], function(err, items) {
          // Ensure set() returned without error.
          assert.isNotOk(err);
          assert.equal(items.length, 1);
          assert.isTrue(items[0].exists);
          return _.delay(cb, 50);
        });
      },

      // Then call get() on the same key.
      function(cb) {
        return harness.SvclibRequest('KVDataStore', 'get', [
          {
            table: 'unit_test',
            key: harness.testKey,
          },
        ], function(err, items) {
          // Ensure get() returned original value
          assert.isNotOk(err);
          assert.equal(items.length, 1);
          var kvPair = items[0];
          assert.isFalse(kvPair.exists);
          assert.isUndefined(kvPair.value);
          return cb();
        });
      },
    ], cb);
  });

});
