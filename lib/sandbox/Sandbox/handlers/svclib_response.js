module.exports = function(svclibResponse) {
  try {
    this.child_.stdin.write(JSON.stringify([
        'svclib_response', svclibResponse]) + '\n', 'utf-8');
  } catch(e) { }
};
