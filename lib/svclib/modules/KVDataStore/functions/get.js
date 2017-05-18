const _ = require('lodash'),
  assert = require('assert')
;


function KVDataStoreGet(baseConnection, getItems, cb) {
  assert(this.isSvclib());
  const kvd = this.modules_.KVDataStore;

  const kvMap = kvd.kvMap_;
  const result = _.map(getItems, (item) => {
    if (item.table in kvMap) {
      if (item.key in kvMap[item.table]) {
        const kvItem = kvMap[item.table][item.key];
        if (!kvItem.expires || (kvItem.expires > Date.now())) {
          return _.cloneDeep(kvItem);
        }
        delete kvMap[item.table][item.key];
        kvd.kvMapDirty_ = true;
      }
    }
    return {
      table: item.table,
      key: item.key,
      exists: false,
    };
  });

  _.delay(() => {
    return cb(null, result);
  }, _.random(50));
}


KVDataStoreGet.$schema = require('./get.schema');


module.exports = KVDataStoreGet;
