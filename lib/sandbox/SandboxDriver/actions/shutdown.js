module.exports = function() {
  this.emit('shutdown');
  setTimeout(function() {
    process.exit(0);
  }, 500);
};
