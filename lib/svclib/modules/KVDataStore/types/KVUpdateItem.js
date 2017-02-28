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
        'If `true`: key must already exist, with hash specified by field `hash`.\n',
        'If `false`: key must not already exist.',
      ].join('\n'),
      optional: true,
    },
    valueId: {
      type: 'base64_buffer',
      group: 'Preconditions',
      desc: 'If `exists==true`, then hash of previous value.',
      optional: true,
    },
    delete: {
      type: 'boolean',
      group: 'Postconditions',
      desc: 'If `true`: key should be deleted.',
      optional: true,
    },
    value: {
      type: 'any',
      group: 'Postconditions',
      desc: 'If `delete==false`, then the new value that the key should be set to.',
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
