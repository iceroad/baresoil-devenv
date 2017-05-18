/* eslint global-require: "ignore" */
module.exports = {
  extract: require('./extract'),
  onHttpIncomingRequest: require('./onHttpIncomingRequest'),
  onWsConnectionStart: require('./onWsConnectionStart'),
  onWsConnectionEnd: require('./onWsConnectionEnd'),
  onWsError: require('./onWsError'),
  onWsMessageIncoming: require('./onWsMessageIncoming'),
};
