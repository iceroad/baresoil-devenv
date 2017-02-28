var _ = require('lodash')
  , assert = require('assert')
  , common = require('./common')
  , digest = require('../../../../util/digest')
  , fmt = require('util').format
  , json = JSON.stringify
  , stablejson = require('json-stable-stringify')
  , PublicError = require('../../../../errors')
  ;


function lookup(kvMap, table, key) {
  if (table in kvMap) {
    if (key in kvMap[table]) {
      return kvMap[table][key];
    }
  }
}


function KVDataStore_update(baseConnection, updateItems, cb) {
  assert(this.isSvclib());
  var kvd = this.modules_.KVDataStore;
  var kvMap = kvd.kvMap_;

  //
  // Ensure that all items corresspond to some known operation.
  //
  var operations;
  try {
    operations = _.map(updateItems, ItemToOpType);
  } catch(e) {
    return cb(new PublicError('invalid_argument', {
      message: e.message,
    }))
  }

  //
  // Apply the transaction, recording rollback actions.
  //
  var rollback = [], result;
  try {
    result = _.map(updateItems, function(item, idx) {
      var table = item.table;
      var key = item.key;
      var currentValue = lookup(kvMap, table, key);

      // Deletes are unconditional.
      if (operations[idx] === 'delete') {
        rollback.push([table, key, currentValue]);
        if (currentValue) {
          delete kvMap[table][key];
        }
        return {
          table: table,
          key: key,
          exists: false,
        };
      }

      // Conditional updates require their conditions to match.
      if (operations[idx] === 'update_if') {
        if (!currentValue || currentValue.valueId !== item.valueId) {
          throw new PublicError('modified', {
            message: 'Some keys have been concurrently modified, please try again.',
            key: item.key,
            table: item.table,
          });
        }
        var newValue = common.MakeItem(table, key, item.value);
        newValue.created = currentValue.created;
        if (item.expires) {
          newValue.expires = item.expires;
        }
        rollback.push([table, key, currentValue]);
        kvMap[table][key] = newValue;
        var rv = _.clone(newValue);
        delete rv.value;
        return rv;
      }

      // Inserts require the value not to currently exist.
      if (operations[idx] === 'insert') {
        var currentValue = lookup(kvMap, item.table, item.key);
        if (currentValue) {
          throw new PublicError('conflict', {
            message: 'There was a conflict in one of your keys.',
            key: item.key,
            table: item.table,
          });
        }
        var newValue = common.MakeItem(table, key, item.value);
        newValue.created = Date.now();
        if (item.expires) {
          newValue.expires = item.expires;
        }
        rollback.push([table, key, undefined]);
        kvMap[table] = kvMap[table] || {};
        kvMap[table][key] = newValue;
        var rv = _.clone(newValue);
        delete rv.value;
        return rv;
      }

      // Upserts are unconditional SET operations.
      if (operations[idx] === 'upsert') {
        var newValue = common.MakeItem(table, key, item.value);
        if (currentValue) {
          newValue.created = currentValue.created;
          newValue.expires = currentValue.expires;
        } else {
          newValue.created = Date.now();
        }
        if (item.expires) {
          newValue.expires = item.expires;
        }
        rollback.push([table, key, currentValue]);
        kvMap[table] = kvMap[table] || {};
        kvMap[table][key] = newValue;
        var rv = _.clone(newValue);
        delete rv.value;
        return rv;
      }

      throw new PublicError('internal', {
        message: fmt('Unknown operation "%s"', operations[idx]),
      });
    });
  } catch(e) {
    // Roll back transaction in reverse order.
    _.forEach(_.reverse(rollback), function(op) {
      var table = op[0];
      var key = op[1];
      var value = op[2];
      if (_.isUndefined(value)) {
        if (lookup(kvMap, table, key)) {
          delete kvMap[table][key];
        }
      } else {
        kvMap[table] = kvMap[table] || {};
        kvMap[table][key] = value;
      }
    });
    return cb(e);
  }

  kvd.kvMapDirty_ = true;

  _.delay(function() {
    return cb(null, result);
  }, 50);
}

KVDataStore_update.$schema = require('./update.schema');

function ItemToOpType(item, idx) {
  // Setting "delete" overrides everything else.
  if (item.delete) {
    if (item.upsert) {
      throw new Error(fmt(
          'Item %d has "upsert" and "delete" both set. Only one can be set.',
          idx));
    }
    return 'delete';
  }
  if ('value' in item && !_.isUndefined(item.value)) {
    if (item.valueId) {
      // Prior valueId specified, conditional update.
      if (item.upsert) {
        throw new Error(fmt(
            'Item %d has "upsert" and "valueId" both set. Only one can be set.',
            idx));
      }
      return 'update_if';
    } else {
      // No prior valueId specified, this is a new value.
      if (item.upsert) {
        return 'upsert';
      }
      return 'insert';
    }
  }
  throw new Error(fmt(
      'Update item %d does not have either "value" or "delete" set.', idx));
}


module.exports = KVDataStore_update;
