var _ = require('lodash')
  , assert = require('chai').assert
  , async = require('async')
  , crypto = require('crypto')
  , fmt = require('util').format
  , json = JSON.stringify
  , Harness = require('./Harness')
  ;


describe('KVDataStore: ' + 'update()'.cyan, function() {
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


  it('failed transactions should roll back', function(cb) {
    var key_1 = _.toString(_.random(0, Number.MAX_SAFE_INTEGER));
    var key_2 = _.toString(_.random(0, Number.MAX_SAFE_INTEGER));

    return async.series([
      // initial call to set() the key.
      function(cb) {
        return harness.SvclibRequest('KVDataStore', 'set', [
          {
            table: 'unit_test',
            key: key_1,
            value: 1,
          },
          {
            table: 'unit_test',
            key: key_2,
            value: 2,
          },
        ], function(err, items) {
          // Ensure set() returned without error.
          assert.isNotOk(err);
          return cb();
        });
      },

      // Then call get() on the same key to start a read-modify-write cycle.
      function(cb) {
        return harness.SvclibRequest('KVDataStore', 'get', [
          {
            table: 'unit_test',
            key: key_1,
          },
        ], function(err, items) {
          // Ensure get() returned original value
          assert.isNotOk(err);
          var items = items;
          assert.strictEqual(items.length, 1);
          assert.strictEqual(items[0].value, 1);

          // This update should not conflict, but should be rolled back as
          // part of the transaction failing.
          items[0].value = 4;

          // Add a non-upsert insert that will conflict with key_2.
          items.push({
            table: 'unit_test',
            key: key_2,
            exists: false,
            value: 3,
          });

          // Change the value and call update() again to complete the
          // read-modify-write cycle.
          harness.SvclibRequest('KVDataStore', 'update', items, function(
              err, items) {
            // Ensure update() fails due to the conflict on key_2.
            assert.isOk(err);
            assert.strictEqual(err.code, 'conflict');
            assert.strictEqual(err.key, key_2);
            return cb();
          })
        });
      },

      // Ensure that the keys have been correctly rolled back.
      function (cb) {
        return harness.SvclibRequest('KVDataStore', 'get', [
          {
            table: 'unit_test',
            key: key_1,
          },
          {
            table: 'unit_test',
            key: key_2,
          },
        ], function(err, items) {
          // Ensure get() returned without error.
          assert.isNotOk(err, json(err));
          var items = items;
          assert.strictEqual(items.length, 2);
          assert.strictEqual(items[0].value, 1, 'transaction not rolled back');
          assert.strictEqual(items[1].value, 2, 'transaction not rolled back');
          return cb();
        });
      },
    ], cb);
  });


});
