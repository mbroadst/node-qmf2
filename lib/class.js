'use strict';
var u = require('./utilities'),
    c = module.exports = {};

function QMFObject(agent, data) {
  // prevent circular structure errors when stringifying to JSON
  Object.defineProperty(this, '_agent', { value: agent });

  // metadata
  this._object_id = u.unwrap_data(data._object_id);
  this._create_ts = u.unwrap_timestamp(data._create_ts);
  this._delete_ts = u.unwrap_timestamp(data._delete_ts);
  this._update_ts = u.unwrap_timestamp(data._update_ts);

  // values
  var _keys = Object.keys(data._values), _len = _keys.length;
  for (var i = 0; i < _len; ++i) this[_keys[i]] = u.unwrap_data(data._values[_keys[i]]);
}

// @TODO: precompile these regexes
function validate_type(o, type) {
  if (type.match(/int|uint|float|double|absTime|deltaTime|uuid|hilo|count|mma/)) {
    return (typeof o === 'number');
  } else if (type.match(/objId|sstr|lstr/)) {
    return (typeof o === 'string');
  } else if (type.match(/bool/)) {
    return (typeof o === 'boolean');
  } else if (type.match(/map/)) {
    return (typeof o === 'object');
  }

  return false;
}

function classMethodInvoke(className, methodDef) {
  return function(options) {
    // build arguments
    var args = {};
    if (!!methodDef.arguments) {
      var _len = methodDef.arguments.length;
      for (var i = 0; i < _len; ++i) {
        var argDef = methodDef.arguments[i];
        if (argDef.dir === 'O') continue;

        if (options.hasOwnProperty(argDef.name)) {
          if (!validate_type(options[argDef.name], argDef.type))
            throw new Error('invalid type for argument: ' + argDef.name);
          args[argDef.name] = options[argDef.name];
        } else if (!!argDef.default) {
          args[argDef.name] = argDef.default;
        } else {
          throw new Error('missing argument: ' + argDef.name);    // @TODO: maybe we can get away with null?
        }
      }
    }

    return this._agent._request('_method_request', this._agent.name, {
      '_object_id': this._object_id,
      '_method_name': methodDef.name,
      '_arguments': args
    });
  };
}

c.define_class = function(name, def) {
  var Class = function(agent, data) { QMFObject.call(this, agent, data); };
  Class.prototype = Object.create(QMFObject.prototype);

  // methods
  if (!!def.methods) {
    def.methods.map(function(m) {
      Class.prototype[m.name] = classMethodInvoke(name, m);
    });
  }

  return Class;
};
