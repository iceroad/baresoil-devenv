
module.exports = function(info, cb) {
  process.nextTick(cb.bind({}, true));
};
