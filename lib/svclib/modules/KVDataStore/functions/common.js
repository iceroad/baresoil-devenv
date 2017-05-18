const _ = require('lodash'),
  stablejson = require('json-stable-stringify'),
  digest = require('../../../../util/digest')
  ;


exports.errors = [
  'internal',
  'quota_exceeded',
  'rate_limit_exceeded',
];


exports.MakeItem = function MakeItem(table, key, value) {
  const valueClone = _.cloneDeep(value) || null;
  const valueJson = Buffer.from(stablejson(valueClone), 'utf-8');
  return {
    table,
    key,
    value: valueClone,
    valueId: digest(valueJson).toString('base64'),
    valueSize: valueJson.length,
    modified: Date.now(),
    exists: true,
  };
};


exports.ItemToOpType = function ItemToOpType(item, idx) {
  // Setting "delete" overrides everything else.
  if (item.delete) {
    if (item.upsert) {
      throw new Error(
          `Item ${idx} has "upsert" and "delete" both set. Only one can be set.`);
    }
    return 'delete';
  }
  if ('value' in item && !_.isUndefined(item.value)) {
    if (item.valueId) {
      // Prior valueId specified, conditional update.
      if (item.upsert) {
        throw new Error(
            `Item ${idx} has "upsert" and "valueId" both set. Only one can be set.`);
      }
      return 'update_if';
    }
      // No prior valueId specified, this is a new value.
    if (item.upsert) {
      return 'upsert';
    }
    return 'insert';
  }
  throw new Error(
      `Item ${idx} does not have either "value" or "delete" set.`);
};
