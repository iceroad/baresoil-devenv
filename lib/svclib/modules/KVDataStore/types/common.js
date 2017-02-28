//
// NOTE: Keep these in sync with schema.js
//
var MEGABYTES = 1024 * 1024;

exports.TableName = {
  type: 'string',
  desc: '__Table/collection name__. Tables group sets of keys into their own namespaces. If the table specified does not exist, it is automatically created.',
  minLength: 1,
  maxLength: 100,
  group: 'Key specification',
};

exports.TableKey = {
  type: 'string',
  desc: '__Key name__. A key can be any valid, JSON-serializable string. Only one instance of a key can exist in a table at a time, i.e., this is not a multi-map.',
  minLength: 1,
  maxLength: 200,
  group: 'Key specification',
};

exports.Exists = {
  type: 'boolean',
  desc: '__Key existence__. If true, indicates that the specified key already exists or should exist in the specified table.',
  group: 'Lifecycle',
  optional: true,
};

exports.Value = {
  type: 'any',
  desc: '__Value__. Value to set the key to. Any JSON-serializable value is allowed, and values are automatically compressed before being stored.',
  optional: true,
  minSize: 1,
  maxSize: 20 * MEGABYTES,
  group: 'Value data',
};

exports.ValueId = {
  type: 'base64_buffer',
  desc: '__Value identifier__. A unique, hash-based identifier for the current value, used for conditional updates.',
  optional: true,
  group: 'Value data',
};

exports.ValueSize = {
  type: 'integer',
  desc: '__Value size__. Size of serialized, compressed stored value in bytes. Note that this is the size of value stored in the database, not the size of the raw input.',
  optional: true,
  group: 'Value data',
  minSize: 1,
  maxSize: 20 * MEGABYTES,
};

exports.Created = {
  type: 'epoch_timestamp_ms',
  desc: '__Key creation time__. The time the key was last added to the table. If a key is deleted and then re-created, its re-creation time will be reflected here, not the time of original creation.',
  optional: true,
  group: 'Timestamps',
};

exports.Modified = {
  type: 'epoch_timestamp_ms',
  desc: '__Key modification time__. The time the key was last modified in the table by changing its value.',
  optional: true,
  group: 'Timestamps',
};

exports.CacheMs = {
  type: 'integer',
  desc: '__Value cache time__. If set to a positive value, the number of milliseconds that the key\'s value can be stored in various caches. __Warning:__ while setting this value can improve performance, your application _must_ be able to tolerate stale data.',
  optional: true,
  group: 'Caching',
  private: true,
};

exports.Expires = {
  type: 'epoch_timestamp_ms',
  desc: '__Key delete time__. If set to a positive value, the timestamp at which the key will be auto-deleted.',
  optional: true,
  group: 'Lifecycle',
};
