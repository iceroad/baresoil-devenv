module.exports = {
  arguments: [
    {
      type: 'BaseConnection',
      private: true,
    },
    {
      type: 'array',
      elementType: 'RBChannelListenRequest',
      minElements: 1,
      maxElements: 10,
    },
  ],
  callbackResult: [
    {
      type: 'array',
      elementType: 'RBChannelCensus',
      minElements: 1,
      maxElements: 10,
    },
  ],
};
