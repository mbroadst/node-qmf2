'use strict';
var u = module.exports = {};

u.isPlainObject = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
};

// @TODO: incorporate property defs into unwrapping
u.unwrap_data = function(value) {
  if (value instanceof Buffer)
    return value.toString('utf8');

  if (u.isPlainObject(value)) {
    var _keys = Object.keys(value), _len = _keys.length;
    for (var i = 0; i < _len; ++i) value[_keys[i]] = u.unwrap_data(value[_keys[i]]);
  }

  return value;


};

u.unwrap_timestamp = function(value) {
  var raw = (typeof value === 'number') ? value : value.toNumber(true);
  return new Date(raw / 1000000);
};
