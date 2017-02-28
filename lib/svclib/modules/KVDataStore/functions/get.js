var _ = require('lodash')
  , assert = require('assert')
  ;


function KVDataStore_get(baseConnection, getItems, cb) {
  assert(this.isSvclib());
  var kvd = this.modules_.KVDataStore;

  var kvMap = kvd.kvMap_;
  var result = _.map(getItems, function(item) {
    if (item.table in kvMap) {
      if (item.key in kvMap[item.table]) {
        var kvItem = kvMap[item.table][item.key];
        if (!kvItem.expires || (kvItem.expires > Date.now())) {
          return _.cloneDeep(kvItem);
        } else {
          delete kvMap[item.table][item.key];
          kvd.kvMapDirty_ = true;
        }
      }
    }
    return {
      table: item.table,
      key: item.key,
      exists: false,
    };
  });

  _.delay(function() {
    return cb(null, result);
  }, _.random(50));
}


KVDataStore_get.$schema = require('./get.schema');


module.exports = KVDataStore_get;
