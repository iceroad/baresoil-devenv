var _ = require('lodash')
  , assert = require('chai').assert
  , async = require('async')
  , colors = require('colors')
  , crypto = require('crypto')
  , fmt = require('util').format
  , json = JSON.stringify
  , Harness = require('../Harness')
  ;


describe('KVDataStore: ' + 'set() and get()'.cyan, function() {
  const harness = new Harness();
  var testKey, testValue;

  this.slow(500);

  before(harness.before.bind(harness));

  beforeEach(function(cb) {
    testKey = 'test, key 💩 ' + _.random(0, 1e10);
    testValue = crypto.randomBytes(20).toString('base64');
    return harness.beforeEach(cb);
  });

  afterEach(harness.afterEach.bind(harness));


  it('should correctly set-then-get a single key' , function(cb) {
    const startTime = Date.now();
    return async.series([
      // First call set().
      function(cb) {
        return harness.run('KVDataStore', 'set', [
          {
            table: 'unit_test',
            key: testKey,
            value: testValue,
          },
        ], function(err, items) {
          assert.isNotOk(err);
          assert.equal(items.length, 1);
          assert.isTrue(items[0].exists);
          assert.isUndefined(items[0].value);
          assert.isTrue(items[0].modified >= startTime);
          return cb();
        });
      },

      // Then call get() on the same key.
      function(cb) {
        return harness.run('KVDataStore', 'get', [
          {
            table: 'unit_test',
            key: testKey,
          },
        ], function(err, items) {
          // Ensure get() returned original value
          assert.isNotOk(err);
          assert.equal(items.length, 1);
          var kvPair = items[0];
          assert.isTrue(kvPair.exists);
          assert.strictEqual(kvPair.value, testValue);
          return cb();
        });
      },
    ], cb);
  });


  it('should not return expired keys', function(cb) {
    return async.series([
      // First call set() on a key.
      function(cb) {
        return harness.run('KVDataStore', 'set', [
          {
            table: 'unit_test',
            key: testKey,
            value: testValue,
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
        return harness.run('KVDataStore', 'get', [
          {
            table: 'unit_test',
            key: testKey,
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


  it('should not return non-existent keys', function(cb) {
    return async.series([
      // Call get() without set() first.
      function(cb) {
        return harness.run('KVDataStore', 'get', [
          {
            table: 'unit_test',
            key: testKey,
          },
        ], function(err, items) {
          assert.isNotOk(err);  // No error for missing keys.
          assert.equal(items.length, 1);
          var kvPair = items[0];
          assert.isFalse(kvPair.exists);
          assert.isUndefined(kvPair.value);
          return cb();
        });
      },
    ], cb);
  });


  it('should unconditionally overwrite keys with set()', function(cb) {
    var newValue = crypto.randomBytes(80).toString('hex');

    return async.series([
      // First call set() with an initial value.
      function(cb) {
        return harness.run('KVDataStore', 'set', [
          {
            table: 'unit_test',
            key: testKey,
            value: testValue,
          },
        ], function(err, items) {
          assert.isNotOk(err);
          assert.equal(items.length, 1);
          assert.isTrue(items[0].exists);
          return cb();
        });
      },

      // Then call set() again with a new value.
      function(cb) {
        return harness.run('KVDataStore', 'set', [
          {
            table: 'unit_test',
            key: testKey,
            value: newValue
          },
        ], function(err, items) {
          assert.isNotOk(err);
          assert.equal(items.length, 1);
          var kvPair = items[0];
          assert.isTrue(kvPair.exists);
          return cb();
        });
      },

      // Finally call get() to see which value is returned.
      function(cb) {
        return harness.run('KVDataStore', 'get', [
          {
            table: 'unit_test',
            key: testKey,
          },
        ], function(err, items) {
          // Ensure get() returned original value
          assert.isNotOk(err);
          assert.equal(items.length, 1);
          var kvPair = items[0];
          assert.isTrue(kvPair.exists);
          assert.strictEqual(kvPair.value, newValue);
          return cb();
        });
      },
    ], cb);
  });
});
