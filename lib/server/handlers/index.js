module.exports = {
  onHttpIncomingRequest: require('./onHttpIncomingRequest'),
  onWsVerifyClient: require('./onWsVerifyClient'),
  onWsConnectionStart: require('./onWsConnectionStart'),
  onWsConnectionEnd: require('./onWsConnectionEnd'),
  onWsError: require('./onWsError'),
  onWsMessageIncoming: require('./onWsMessageIncoming'),
};
