
function HRTimer() {
  this.start_ = process.hrtime();
}

HRTimer.prototype.stop = function() {
  var diff = process.hrtime(this.start_);
  return (diff[0] * 1e9 + diff[1]) / 1e6;
};


module.exports = HRTimer;
