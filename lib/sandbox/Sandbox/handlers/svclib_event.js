module.exports = function(svclibEvent) {
  try {
    this.child_.stdin.write(JSON.stringify([
        'svclib_event', svclibEvent]) + '\n', 'utf-8');
  } catch(e) { }
};
