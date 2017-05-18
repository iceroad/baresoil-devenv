module.exports = {
  arguments: [
    {
      type: 'BaseConnection',
      private: true,
    },
    {
      type: 'array',
      elementType: 'RBStatusChangeRequest',
      minElements: 1,
      maxElements: 10,
    },
  ],
  callbackResult: [
    {
      type: 'any',
    },
  ],
};
