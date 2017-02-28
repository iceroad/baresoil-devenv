var _ = require('lodash')
  , assert = require('assert')
  , digest = require('../../../../util/digest')
  , stablejson = require('json-stable-stringify')
  ;


function KVDataStore_set(baseConnection, setItems, cb) {
  assert(this.isSvclib());
  var kvd = this.modules_.KVDataStore;

  var kvMap = kvd.kvMap_;
  var result = _.map(setItems, function(item) {
    kvMap[item.table] = kvMap[item.table] || {};
    var kvItem = kvMap[item.table][item.key] = kvMap[item.table][item.key] || {};
    var serData = Buffer.from(stablejson(item.value), 'utf-8');
    var valueId = digest(serData, 'base64');
    kvItem.value = _.cloneDeep(item.value);
    kvItem.valueId = valueId;
    kvItem.valueSize = serData.length;
    kvItem.modified = Date.now();
    kvItem.cacheMs = item.cacheMs;
    kvItem.expires = item.expires;
    kvItem.table = item.table;
    kvItem.key = item.key;
    kvItem.exists = true;

    var rv = _.cloneDeep(kvItem);
    delete rv.value;
    return rv;
  });

  kvd.kvMapDirty_ = true;

  _.delay(function() {
    return cb(null, result);
  }, _.random(50));
}

KVDataStore_set.$schema = require('./set.schema');

module.exports = KVDataStore_set;
