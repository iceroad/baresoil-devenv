module.exports = function(errorPrefix, msg) {
  return new Error(
      (errorPrefix ? (errorPrefix + ': ') : '') +
      msg);
};
