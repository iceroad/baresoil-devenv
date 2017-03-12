module.exports = function(fnArg, cb) {
  console.log('Testing 1234');
  console.error('Testing 5678');
  setTimeout(function() {
    process.exit(0);
  }, 10);
  return cb();
};
