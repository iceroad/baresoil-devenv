var _ = require('lodash')
  , assert = require('chai').assert
  , async = require('async')
  , colors = require('colors')
  , crypto = require('crypto')
  , fmt = require('util').format
  , json = JSON.stringify
  , Harness = require('../Harness')
  ;


describe('KVDataStore: ' + 'update()'.cyan, function() {
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


  it('should insert new key if it does not exist', function(cb) {
    var testKey = crypto.randomBytes(60).toString('base64');
    var testValue = { sentinel: 123 };

    return async.series([
      // update() without modifiers should insert a new value.
      function(cb) {
        return harness.run('KVDataStore', 'update', [
          {
            table: 'unit test \'?!;;\'',
            key: testKey,
            value: testValue,
          },
          {
            table: 'unit test \'?!;;\'_2',
            key: testKey,
            value: testValue,
          },
        ], function(err, items) {
          // Ensure update() returned without error.
          assert.isNotOk(err);
          assert.equal(items.length, 2);
          assert.isTrue(items[0].exists);
          assert.isUndefined(items[0].value);
          assert.isTrue(items[1].exists);
          assert.isUndefined(items[1].value);
          return cb();
        });
      },

      // Then call get() on the same key.
      function(cb) {
        return harness.run('KVDataStore', 'get', [
          {
            table: 'unit test \'?!;;\'',
            key: testKey,
          },
        ], function(err, items) {
          // Ensure get() returned original value
          assert.isNotOk(err);
          assert.equal(items.length, 1);
          var kvPair = items[0];
          assert.isTrue(kvPair.exists);
          assert.deepEqual(kvPair.value, testValue);
          assert.strictEqual(
              kvPair.valueId,
              'n0Z8BRGxQRUNTUHZw10NwkSiZYeet73nMQBpPpetfg4=');
          return cb();
        });
      },
    ], cb);
  });


  it('should update an existing key\'s value', function(cb) {
    var newValue = { is_value_new: true };
    var kvPair;

    return async.series([
      // initial call to set() the key.
      function(cb) {
        return harness.run('KVDataStore', 'set', [
          {
            table: 'unit test \'?!;;\'',
            key: testKey,
            value: testValue,
          },
        ], function(error, items) {
          // Ensure set() returned without error.
          assert.isNotOk(error);
          assert.equal(items.length, 1);
          kvPair = items[0];
          assert.isTrue(kvPair.exists);
          assert.isDefined(kvPair.valueId);
          return cb();
        });
      },

      // Use the same kvPair returned by set() to perform a new value update.
      function(cb) {
        kvPair.value = newValue;
        return harness.run('KVDataStore', 'update', [kvPair],
            function(error, items) {
          // Ensure update() succeeded.
          assert.isNotOk(error, error);
          assert.equal(items.length, 1);
          var kvPair = items[0];
          assert.isTrue(kvPair.exists);
          return cb();
        });
      },

      // Retrieve the key again and ensure the new value.
      function(cb) {
        return harness.run('KVDataStore', 'get', [{
          table: 'unit test \'?!;;\'',
          key: testKey,
        }], function(error, items) {
          // Ensure update() succeeded.
          assert.isNotOk(error, error);
          assert.equal(items.length, 1);
          var kvPair = items[0];
          assert.isTrue(kvPair.exists);
          assert.deepEqual(kvPair.value, newValue);
          return cb();
        });
      },
    ], cb);
  });


  it('should not update an existing key if upsert is not specified', function(cb) {
    var newValue = { totally_new_value: 'never_seen_before' };
    var kvPair;

    return async.series([
      // initial call to set() the key.
      function(cb) {
        return harness.run('KVDataStore', 'set', [
          {
            table: 'unit test \'?!;;\'',
            key: testKey,
            value: testValue,
          },
        ], function(error, items) {
          // Ensure set() returned without error.
          assert.isNotOk(error);
          assert.equal(items.length, 1);
          kvPair = items[0];
          assert.isTrue(kvPair.exists);
          assert.isDefined(kvPair.valueId);
          return cb();
        });
      },

      // Attempt to update the key without upsert.
      function(cb) {
        return harness.run('KVDataStore', 'update', [{
          table: 'unit test \'?!;;\'',
          key: testKey,
          value: newValue,
        }], function(error, items) {
          // Ensure update() failed.
          assert.strictEqual(error.code, 'conflict');
          assert.strictEqual(error.key, testKey);
          assert.strictEqual(error.table, 'unit test \'?!;;\'');
          assert.isUndefined(items);
          return cb();
        });
      },
    ], cb);
  });


  it('should delete keys if delete=true', function(cb) {
    return async.series([
      // initial call to set() the key.
      function(cb) {
        return harness.run('KVDataStore', 'set', [
          {
            table: 'unit_test',
            key: testKey,
            value: testValue,
          },
        ], cb);
      },

      // call get, then update with the delete flag.
      function(cb) {
        return harness.run('KVDataStore', 'get', [
          {
            table: 'unit_test',
            key: testKey,
          },
        ], function(err, items) {
          // This should return an error.
          assert.isNotOk(err, items);
          assert.isOk(items.length);
          assert.isTrue(items[0].exists);

          // Mark the deletion flag.
          items[0].delete = true;
          return harness.run('KVDataStore', 'update', items,
              function(err, items) {
            assert.isNotOk(err);
            assert.isOk(items[0]);
            return cb();
          });
        });
      },

      // Final get() should not return the kvPair anymore.
      function(cb) {
        return harness.run('KVDataStore', 'get', [
          {
            table: 'unit_test',
            key: testKey,
          },
        ], function(err, items) {
          // This should not return an error.
          assert.isNotOk(err);
          assert.isOk(items[0]);
          assert.isFalse(items[0].exists);
          assert.isUndefined(items[0].value)
          assert.isUndefined(items[0].valueId)
          return cb();
        });
      },
    ], cb);
  });
});
