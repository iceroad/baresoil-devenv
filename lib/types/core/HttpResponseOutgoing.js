var _ = require('lodash')
  , common = require('../common')
  ;


var KILOBYTES = 1024;


module.exports = {
  name: 'HttpResponseOutgoing',
  type: 'object',
  fields: {
    statusCode: {
      type: 'integer',
      minValue: 100,
      maxValue: 599,
    },
    body: {
      type: 'base64_buffer',
      optional: true,
    },
    headers: {
      type: 'object',
      optional: true,
    },
  },
};
