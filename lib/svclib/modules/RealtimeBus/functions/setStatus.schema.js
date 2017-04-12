var def = require('runtype').schemaDef;

module.exports = {
  input: [
    {
      type: 'array',
      elementType: 'RBChannelStatusChangeRequest',
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
