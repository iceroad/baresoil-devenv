var _ = require('lodash')
  , common = require('../common')
  ;


var KILOBYTES = 1024;


module.exports = {
  name: 'HttpRequestIncoming',
  type: 'object',
  fields: {
    files: {
      type: 'object'
    },
    fields: {
      type: 'object',
    },
    headers: {
      type: 'object',
    },
    method: {
      type: 'string',
      minLength: 3,
      maxLength: 16,
    },
    cookies: {
      type: 'object',
    },
    url: {
      type: 'string',
      minLength: 1,
      maxLength: 16 * KILOBYTES,
    },
  },
};
