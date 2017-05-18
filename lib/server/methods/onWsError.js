module.exports = function onWsError(error) {
  if (process.env.VERBOSE) {
    console.error(error);
  }
};
