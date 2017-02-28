var def = require('runtype').schemaDef;

module.exports = {
  input: [
    {
      type: 'array',
      elementType: 'RBChannelListenRequest',
      minElements: 1,
      maxElements: 10,
    },
  ],
  output: [
    {
      type: 'any',
    },
  ],
}
