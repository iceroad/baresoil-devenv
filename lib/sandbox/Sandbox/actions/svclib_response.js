module.exports = function(svclibResponse) {
  this.child_.stdin.write(JSON.stringify([
      'svclib_response', svclibResponse]) + '\n', 'utf-8');
};
