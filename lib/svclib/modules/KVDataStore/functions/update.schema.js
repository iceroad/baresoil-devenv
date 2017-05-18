module.exports = {
  arguments: [
    {
      type: 'BaseConnection',
      private: true,
    },
    {
      type: 'array',
      elementType: 'KVUpdateItem',
      minElements: 1,
      maxElements: 25,
      name: 'updates',
      desc: 'Update specifications to be executed inside the transaction.',
    },
  ],
  callbackResult: [
    {
      type: 'array',
      elementType: 'KVPairMetadata',
      minElements: 1,
      maxElements: 25,
      name: 'kvPairMeta',
      desc: 'Updated metadata for all keys.',
    },
  ],
};
