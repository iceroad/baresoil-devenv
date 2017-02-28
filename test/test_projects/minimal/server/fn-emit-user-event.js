module.exports = function(cb) {
  this.emit('user_event', {
    name: 'test_event',
    data: {
      testing: 123,
    },
  });
  return cb(null, fnArg);
};
