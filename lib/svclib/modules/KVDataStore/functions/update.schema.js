var def = require('runtype').schemaDef;

module.exports = {
  input: [
    {
      type: 'array',
      elementType: 'KVUpdateItem',
      minElements: 1,
      maxElements: 25,
    },
  ],
  output: [
    {
      type: 'array',
      elementType: 'KVPairMetadata',
      minElements: 1,
      maxElements: 25,
    },
  ],
}
