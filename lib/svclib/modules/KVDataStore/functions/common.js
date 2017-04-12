var _ = require('lodash')
  , stablejson = require('json-stable-stringify')
  , digest = require('../../../../util/digest')
  ;


exports.errors = [
  'internal',
  'quota_exceeded',
  'rate_limit_exceeded',
];

exports.MakeItem = function(table, key, value) {
  var valueClone = _.cloneDeep(value) || null;
  var valueJson = Buffer.from(stablejson(valueClone), 'utf-8');
  return {
    table: table,
    key: key,
    value: valueClone,
    valueId: digest(valueJson).toString('base64'),
    valueSize: valueJson.length,
    modified: Date.now(),
    exists: true,
  };
};
