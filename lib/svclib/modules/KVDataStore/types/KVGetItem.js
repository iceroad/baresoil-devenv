var common = require('./common');

module.exports = {
  name: 'KVGetItem',
  desc: 'Table-key pair to use to lookup the value or metadata associated with a key.',
  type: 'object',
  fields: {
    table: common.TableName,
    key: common.TableKey,
  },
};
