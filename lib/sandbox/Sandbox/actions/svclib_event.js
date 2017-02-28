module.exports = function(svclibEvent) {
  this.child_.stdin.write(JSON.stringify([
      'svclib_event', svclibEvent]) + '\n', 'utf-8');
};
