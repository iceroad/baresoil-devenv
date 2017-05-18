const _ = require('lodash'),
  assert = require('assert'),
  common = require('./common'),
  fmt = require('util').format,
  ItemToOpType = require('./common').ItemToOpType,
  PublicError = require('../../../../errors')
  ;


function lookup(kvMap, table, key) {
  if (table in kvMap) {
    if (key in kvMap[table]) {
      return kvMap[table][key];
    }
  }
}


function KVDataStoreUpdate(baseConnection, updateItems, cb) {
  assert(this.isSvclib());
  const kvd = this.modules_.KVDataStore;
  const kvMap = kvd.kvMap_;

  //
  // Ensure that all items corresspond to some known operation.
  //
  let operations;
  try {
    operations = _.map(updateItems, ItemToOpType);
  } catch (e) {
    return cb(new PublicError('invalid_argument', {
      message: e.message,
    }));
  }

  //
  // Apply the transaction, recording rollback actions.
  //
  const rollback = [];
  let result;
  try {
    result = _.map(updateItems, (item, idx) => {
      const table = item.table;
      const key = item.key;
      const currentValue = lookup(kvMap, table, key);

      // Deletes are unconditional.
      if (operations[idx] === 'delete') {
        rollback.push([table, key, currentValue]);
        if (currentValue) {
          delete kvMap[table][key];
        }
        return {
          table,
          key,
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
        const newValue = common.MakeItem(table, key, item.value);
        newValue.created = currentValue.created;
        if (item.expires) {
          newValue.expires = item.expires;
        }
        rollback.push([table, key, currentValue]);
        kvMap[table][key] = newValue;
        const rv = _.clone(newValue);
        delete rv.value;
        return rv;
      }

      // Inserts require the value not to currently exist.
      if (operations[idx] === 'insert') {
        if (currentValue) {
          throw new PublicError('conflict', {
            message: 'There was a conflict in one of your keys.',
            key: item.key,
            table: item.table,
          });
        }
        const newValue = common.MakeItem(table, key, item.value);
        newValue.created = Date.now();
        if (item.expires) {
          newValue.expires = item.expires;
        }
        rollback.push([table, key, undefined]);
        kvMap[table] = kvMap[table] || {};
        kvMap[table][key] = newValue;
        const rv = _.clone(newValue);
        delete rv.value;
        return rv;
      }

      // Upserts are unconditional SET operations.
      if (operations[idx] === 'upsert') {
        const newValue = common.MakeItem(table, key, item.value);
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
        const rv = _.clone(newValue);
        delete rv.value;
        return rv;
      }

      throw new PublicError('internal', {
        message: fmt('Unknown operation "%s"', operations[idx]),
      });
    });
  } catch (e) {
    // Roll back transaction in reverse order.
    _.forEach(_.reverse(rollback), (op) => {
      const table = op[0];
      const key = op[1];
      const value = op[2];
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

  _.delay(() => {
    return cb(null, result);
  }, _.random(10, 50));
}


KVDataStoreUpdate.$schema = require('./update.schema');


module.exports = KVDataStoreUpdate;
