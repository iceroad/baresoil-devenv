module.exports = function(fnArg, cb) {
  return cb(null, {
    someAuthData: 'something',
  });
};
