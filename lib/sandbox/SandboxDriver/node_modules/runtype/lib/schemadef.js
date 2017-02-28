exports.Callback = function() {
  return {
    type: 'function'
  };
}


exports.TypedObject = function(fields) {
  return {
    type: 'object',
    fields: fields,
  };
};


exports.Literal = function(value) {
  return {
    type: 'literal',
    value: value,
  };
};


exports.Type = function(typeName) {
  return {
    type: typeName,
  };
};


exports.TypedArray = function(elements) {
  return {
    type: 'array',
    elements: elements,
  };
};
