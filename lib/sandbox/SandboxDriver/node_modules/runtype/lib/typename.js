var _ = require('lodash');

module.exports = function(val) {
  if (_.isUndefined(val)) return 'undefined';
  if (_.isNull(val)) return 'null';
  if (_.isFunction(val)) return 'function';
  if (_.isNumber(val)) return 'number';
  if (_.isBoolean(val)) return 'boolean';
  if (_.isDate(val)) return 'date';
  if (_.isString(val)) return 'string';
  if (_.isArray(val)) return 'array';
  if (_.isBuffer(val)) return 'buffer';
  if (_.isObject(val)) return 'object';
};
