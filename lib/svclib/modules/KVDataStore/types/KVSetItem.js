var common = require('./common');

module.exports = {
  name: 'KVSetItem',
  desc: 'Item in a KVDataStore.set() operation.',
  type: 'object',
  fields: {
    table: common.TableName,
    key: common.TableKey,
    value: common.Value,
    cacheMs: common.CacheMs,
    expires: common.Expires,
  },
};
