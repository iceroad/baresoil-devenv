const _ = require('lodash'),
  assert = require('assert'),
  digest = require('../../../../util/digest'),
  stablejson = require('json-stable-stringify')
  ;


function KVDataStoreSet(baseConnection, setItems, cb) {
  assert(this.isSvclib());
  const kvd = this.modules_.KVDataStore;

  const kvMap = kvd.kvMap_;
  const result = _.map(setItems, (item) => {
    kvMap[item.table] = kvMap[item.table] || {};
    const kvItem = kvMap[item.table][item.key] = kvMap[item.table][item.key] || {};
    const serData = Buffer.from(stablejson(item.value || null), 'utf-8');
    const valueId = digest(serData, 'base64');
    kvItem.value = _.cloneDeep(item.value);
    kvItem.valueId = valueId;
    kvItem.valueSize = serData.length;
    kvItem.modified = Date.now();
    kvItem.cacheMs = item.cacheMs;
    kvItem.expires = item.expires;
    kvItem.table = item.table;
    kvItem.key = item.key;
    kvItem.exists = true;

    const rv = _.cloneDeep(kvItem);
    delete rv.value;
    return rv;
  });

  kvd.kvMapDirty_ = true;

  _.delay(() => {
    return cb(null, result);
  }, _.random(10, 50));
}

KVDataStoreSet.$schema = require('./set.schema');

module.exports = KVDataStoreSet;
