var _ = require('lodash')
  , common = require('./common')
  ;


module.exports = {
  name: 'KVUpdateItem',
  desc: 'Individual update operation for a KVDataStore.update() transaction.',
  type: 'object',
  fields: {
    table: common.TableName,
    key: common.TableKey,
    exists: {
      type: 'boolean',
      group: 'Preconditions',
      desc: [
        'If `true`, indicates that the key must already exist, with the same `valueId` as specified.\n',
        'If `false`, then the key must not already exist.',
      ].join('\n'),
      optional: true,
    },
    valueId: {
      type: 'base64_buffer',
      group: 'Preconditions',
      desc: 'If `exists==true`, then the current `valueId` in the data store must match this value.',
      optional: true,
    },
    delete: {
      type: 'boolean',
      group: 'Postconditions',
      desc: 'If `true`, the key should be deleted if it exists.',
      optional: true,
    },
    value: {
      type: 'any',
      group: 'Postconditions',
      desc: 'The new value that the key should be set to, if `delete` is not set.',
      optional: true,
    },
    cacheMs: _.merge({}, common.CacheMs, {
      group: 'Postconditions',
      desc: 'The new cache expiry time in milliseconds, or 0 to disable caching for this key (default). Note that existing caches will take some time to transition to the new behavior.',
      optional: true,
    }),
    expires: _.merge({}, common.Expires, {
      group: 'Postconditions',
      desc: 'The new key auto-deletion time, or 0 to disable auto-delete (default).',
      optional: true,
    }),
  },
  ignored: [
    'created',
    'modified',
    'valueSize',
  ],
};
