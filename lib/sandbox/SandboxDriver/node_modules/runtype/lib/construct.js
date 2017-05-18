var _ = require('lodash')
  , assert = require('assert')
  , builtins = require('./builtins')
  , fmt = require('util').format
  , json = JSON.stringify
  , types = require('./library')
  , typename = require('./typename')
  , ErrorMessage = require('./ErrorMessage')
  ;


function construct(typeDef, typeArg, errorPrefix) {
  //
  // Shorthand: specifying a string instead of an object type definition leads
  // to a lookup in the library.
  //
  if (_.isString(typeDef)) {
    if (!types[typeDef]) {
      throw new Error('Invalid type name: ' + typeDef);
    }
    typeDef = types[typeDef];
  }

  //
  // Validate type definition.
  //
  if (!_.isObject(typeDef)) {
    throw ErrorMessage(errorPrefix, fmt(
        'Invalid type definition: expected object, got %s.',
        typename(typeDef)));
  }
  if (!_.isString(typeDef.type)) {
    throw ErrorMessage(errorPrefix, fmt(
        'Invalid type definition: expected a string "type" field, got %s.',
        typename(typeDef.type)));
  }

  //
  // Check for references to type library.
  //
  if (types[typeDef.type]) {
    var refSchema = types[typeDef.type];
    var tdCopy = _.cloneDeep(typeDef);
    delete tdCopy.type;
    typeDef = _.merge({}, refSchema, tdCopy);
  }

  //
  // Omit optional, unspecified values.
  //
  if (_.isUndefined(typeArg) && typeDef.optional) {
    return;
  }

  //
  // Construct native types using builtins.
  //
  if (builtins[typeDef.type]) {
    return builtins[typeDef.type](typeDef, typeArg, errorPrefix);
  }

  //
  // Objects must have their fields recursed on.
  //
  if (typeDef.type === 'object') {
    if (!_.isObject(typeArg)) {
      throw ErrorMessage(errorPrefix, fmt(
          'expected an object, got %s.', typename(typeArg)));
    }
    if (!typeDef.fields) {
      return typeArg;
    }
    return _.mapValues(typeDef.fields, function(fieldSchema, fieldName) {
      // If the field is a named type, override reference schema.
      var newPrefix = (errorPrefix || '') + '.' + fieldName;
      return construct(fieldSchema, typeArg[fieldName], newPrefix);
    });
  }

  //
  // Arrays can be uniformly typed or per-index typed.
  //
  if (typeDef.type === 'array') {
    if (!_.isArray(typeArg)) {
      throw ErrorMessage(errorPrefix, fmt(
          'expected an array, got %s.', typename(typeArg)));
    }

    // Test array length bounds.
    if (typeDef.minElements && typeArg.length < typeDef.minElements) {
      throw ErrorMessage(errorPrefix, fmt(
        'expected an array of length >= %d, got length %d.',
        typeDef.minElements, typeArg.length));
    }
    if (typeDef.maxElements && typeArg.length > typeDef.maxElements) {
      throw ErrorMessage(errorPrefix, fmt(
        'expected an array of length <= %d, got length %d.',
        typeDef.maxElements, typeArg.length));
    }

    // Handle typed arrays
    if (typeDef.elementType) {
      // All elements are of the same type.
      return _.map(typeArg, function(elem, idx) {
        var newPrefix = (errorPrefix || '') + fmt('Index %d', idx);
        return construct(typeDef.elementType, elem, newPrefix);
      });
    } else {
      if (typeDef.elements) {
        // Per-index typed elements
        if (typeDef.elements.length !== typeArg.length) {
          throw ErrorMessage(errorPrefix, fmt(
            'expected an array of length %d, got length %d.',
            typeDef.elements.length, typeArg.length));
        }
        return _.map(typeDef.elements, function(elemType, idx) {
          var newPrefix = (errorPrefix || '');
          newPrefix += elemType.name ?
              fmt('Index %d (%s)', idx, elemType.name) : fmt('Index %d', idx);
          return construct(elemType, typeArg[idx], newPrefix);
        });
      }
    }

    // Untyped array.
    return typeArg;
  }

  throw ErrorMessage(errorPrefix, fmt(
      'Invalid type definition: unknown type "%s".', typeDef.type));
};


module.exports = construct;
