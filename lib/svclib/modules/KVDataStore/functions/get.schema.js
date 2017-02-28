var def = require('runtype').schemaDef;

module.exports = {
  input: [
    {
      type: 'array',
      elementType: 'KVGetItem',
      minElements: 1,
      maxElements: 25,
    },
  ],
  output: [
    {
      type: 'array',
      elementType: 'KVPair',
      minElements: 1,
      maxElements: 25,
    },
  ],
}
