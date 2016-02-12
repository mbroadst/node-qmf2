'use strict';
var Promise = require('bluebird'),
    uuid = require('uuid'),
    log = require('./log'),
    classes = require('./class_defs'),
    errors = require('./errors'),
    u = require('./utilities');

function Agent(name, client, responseTopic) {
  this.name = name;
  this.client = client;
  this.replyTo = responseTopic || 'qmf.default.topic/' + uuid.v4();
  this.nextCorrelationId = 0;
  this.requests = {};
}

Agent.prototype.initialize = function() {
  var self = this;
  return Promise.all([
    this.client.createReceiver(this.replyTo), this.client.createSender('qmf.default.direct')
  ])
  .spread(function(receiver, sender) {
    self._sender = sender;
    receiver.on('message', function(message) {
      var correlationId = message.properties.correlationId;
      if (correlationId === undefined || correlationId === null) {
        log.error('message lacks correlation-id');
        return;
      }

      if (!self.requests.hasOwnProperty(correlationId)) {
        log.error('invalid correlation-id: ', correlationId);
        return;
      }

      // complete request
      self.requests[correlationId](null, message);
      delete self.requests[correlationId];
    });

    receiver.on('error', function(err) {
      var _keys = Object.keys(self.requests), _len = _keys.length;
      for (var i = 0; i < _len; ++i) self.requests[_keys[i]](err, null);
    });
  });
};

function messageHandler(opcode, resolve, reject) {
  return function(err, message) {
    if (!!err) return reject(err);
    var messageOpcode = message.applicationProperties['qmf.opcode'];
    if (messageOpcode === '_exception') {
      return reject(new errors.AgentExceptionError(message.body._values));
    }

    if ((opcode === '_method_request' && messageOpcode !== '_method_response') ||
        (opcode === '_query_request' && messageOpcode !== '_query_response')) {
      return reject(new errors.InvalidResponseError(messageOpcode));
    }

    if (opcode === '_method_request') return resolve(u.unwrap_data(message.body._arguments));
    if (message.body instanceof Array && message.body.length === 1) {
      resolve(message.body[0]);
    } else {
      resolve(message.body);
    }
  };
}

Agent.prototype._rpcSend = function(content, subject, messageOptions, options) {
  this.nextCorrelationId++;
  var correlationId = '' + this.nextCorrelationId;
  options = options || { timeout: 5000 };
  messageOptions.properties = {
    subject: !!subject ? subject : 'broker',
    replyTo: this.replyTo,
    correlationId: correlationId
  };

  var self = this;
  var response = new Promise(function(resolve, reject) {
    self.requests[correlationId] =
      messageHandler(messageOptions.applicationProperties['qmf.opcode'], resolve, reject);

    setTimeout(function() {
      if (self.requests.hasOwnProperty(correlationId)) {
        delete self.requests[correlationId];
        reject(new errors.TimeoutError());
      }
    }, options.timeout);
  });

  this._sender.send(content, messageOptions);
  return response;
};

Agent.prototype._request = function(opcode, subject, content, options) {
  return this._rpcSend(content, subject, {
    applicationProperties: {
      'method': 'request',
      'qmf.opcode': opcode,
      'x-amqp-0-10.app-id' : 'qmf2'
    }
  }, options);
};

Agent.prototype._nameQuery = function(name, options) {
  return this._request('_query_request', 'broker', {
    '_what': 'OBJECT',
    '_object_id': {
      '_object_name': name
    }
  }, options);
};

Agent.prototype._classQuery = function(className, options) {
  return this._request('_query_request', 'broker', {
    '_what': 'OBJECT',
    '_schema_id': {
      '_class_name': className
    }
  }, options);
};

Agent.prototype._getObjects = function(type, options) {
  var self = this;
  return this._classQuery(type, options)
    .then(function(objects) { return Array.isArray(objects) ? objects : [ objects ]; })
    .map(function(object) { return new classes[type](self, object); });
};

Agent.prototype._getObject = function(type, name, options) {
  var self = this;
  return this._nameQuery(name, options)
    .then(function(object) { return new classes[type](self, object); });
};

module.exports = Agent;
