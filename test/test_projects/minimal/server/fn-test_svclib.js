var crypto = require('crypto');

module.exports = function(cb) {
  this.svclib.KVDataStore.set([{
    table: 'unit_test',
    key: crypto.randomBytes(8).toString('base64'),
    value: 'sentinel string.',
  }], cb);
};
