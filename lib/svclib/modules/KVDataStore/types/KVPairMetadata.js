var common = require('./common');

module.exports = {
  name: 'KVPairMetadata',
  desc: 'Metadata for a key-value pair stored in the database.',
  type: 'object',
  fields: {
    table: common.TableName,
    key: common.TableKey,
    exists: common.Exists,
    valueId: common.ValueId,
    valueSize: common.ValueSize,
    created: common.Created,
    modified: common.Modified,
    cacheMs: common.CacheMs,
    expires: common.Expires,
  },
};
