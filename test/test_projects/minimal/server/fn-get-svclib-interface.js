module.exports = function(cb) {
  var result = {};
  for (var svcName in this.svclib) {
    result[svcName] = {};
    for (var fnName in this.svclib[svcName]) {
      result[svcName][fnName] = 1;
    }
  }
  return cb(null, result);
};
