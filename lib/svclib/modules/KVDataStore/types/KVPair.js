var common = require('./common');

module.exports = {
  name: 'KVPair',
  desc: 'Snapshot of a key-value pair stored in the database.',
  type: 'object',
  fields: {
    table: common.TableName,
    key: common.TableKey,
    exists: common.Exists,
    value: common.Value,
    valueId: common.ValueId,
    valueSize: common.ValueSize,
    created: common.Created,
    modified: common.Modified,
    cacheMs: common.CacheMs,
    expires: common.Expires,
  },
};
