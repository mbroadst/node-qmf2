'use strict';
var util = require('util'),
    errors = module.exports = {};

errors.BaseError = function() {
  var tmp = Error.apply(this, arguments);
  tmp.name = this.name = 'QMFError';

  this.message = tmp.message;
  if (Error.captureStackTrace)
    Error.captureStackTrace(this, this.constructor);
};
util.inherits(errors.BaseError, Error);

errors.AgentExceptionError = function(values) {
  errors.BaseError.call(this, values.error_text);
  this.name = 'QMFAgentExceptionError';
  this.errorText = values.error_text;
};
util.inherits(errors.AgentExceptionError, errors.BaseError);

errors.InvalidResponseError = function(opcode) {
  errors.BaseError.call(this, opcode);
  this.name = 'QMFInvalidResponseError';
  this.opcode = opcode;
};
util.inherits(errors.InvalidResponseError, errors.BaseError);

errors.TimeoutError = function() {
  errors.BaseError.call(this, 'request timed out');
  this.name = 'QMFTimeoutError';
};
util.inherits(errors.TimeoutError, errors.BaseError);
