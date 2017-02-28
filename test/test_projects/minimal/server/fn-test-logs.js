module.exports = function(fnArg, cb) {
  console.log('Testing 1234');
  console.error('Testing 5678');
  setTimeout(function() {
    return cb();
  }, 50);
};
