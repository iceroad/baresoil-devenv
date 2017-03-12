module.exports = {
  onHttpIncomingRequest: require('./onHttpIncomingRequest'),
  onWsConnectionStart: require('./onWsConnectionStart'),
  onWsConnectionEnd: require('./onWsConnectionEnd'),
  onWsError: require('./onWsError'),
  onWsMessageIncoming: require('./onWsMessageIncoming'),
};
