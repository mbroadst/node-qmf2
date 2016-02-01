'use strict';
var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('qmf2'),
    uuid = require('uuid');

function BrokerObject(data) {
  this.objectId = data._object_id._object_name;
  this.createTime = data._create_ts;
  this.deleteTime = data._delete_ts;
  this.updateTime = data._update_ts;

  var self = this;
  Object.keys(data._values).forEach(function(key) {
    self[key] = data._values[key];
  });
}

function BrokerAgent(client, responseTopic) {
  this.client = client;
  this.replyTo = responseTopic || 'qmf.default.topic/' + uuid.v4();
  this.nextCorrelationId = 0;
  this.requests = {};
}

BrokerAgent.prototype.initialize = function() {
  var self = this;
  return Promise.all([
    this.client.createReceiver(this.replyTo),
    this.client.createSender('qmf.default.direct')
  ])
  .spread(function(receiver, sender) {
    self._sender = sender;
    receiver.on('message', function(message) {
      var correlationId = message.properties.correlationId;
      if (correlationId === undefined || correlationId === null) {
        debug('message lacks correlation-id');
        return;
      }

      if (!self.requests.hasOwnProperty(correlationId)) {
        debug('invalid correlation-id');
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
    if (messageOpcode === '_exception')
      return reject('exception from agent: ' + message.body._values);

    if ((opcode === '_method_request' && messageOpcode !== '_method_response') ||
        (opcode === '_query_request' && messageOpcode !== '_query_response')) {
      return reject('bad response: ' + messageOpcode);
    }

    if (opcode === '_method_request') return resolve(message.body._arguments);
    if (message.body instanceof Array && message.body.length === 1) {
      resolve(message.body[0]);
    } else {
      resolve(message.body);
    }
  };
}

BrokerAgent.prototype._sendBrokerRpcMessage = function(content, options) {
  this.nextCorrelationId++;
  var correlationId = '' + this.nextCorrelationId;
  options.properties = {
    subject: 'broker',
    replyTo: this.replyTo,
    correlationId: correlationId
  };

  var self = this;
  var response = new Promise(function(resolve, reject) {
    self.requests[correlationId] =
      messageHandler(options.applicationProperties['qmf.opcode'], resolve, reject);
  });

  this._sender.send(content, options);
  return response;
};

BrokerAgent.prototype._request = function(opcode, content) {
  return this._sendBrokerRpcMessage(content, {
    applicationProperties: {
      'method': 'request',
      'qmf.opcode': opcode,
      'x-amqp-0-10.app-id' : 'qmf2'
    }
  });
};

BrokerAgent.prototype._method = function(method, options) {
  var content = {
    '_object_id'   : {
      '_object_name' : options.address || 'org.apache.qpid.broker:broker:amqp-broker'
    },
    '_method_name' : method,
    '_arguments'   : options.arguments || {}
  };

  return this._request('_method_request', content);
};

BrokerAgent.prototype._nameQuery = function(objectId) {
  return this._request('_query_request', {
    '_what': 'OBJECT',
    '_object_id': {
      '_object_name': objectId
    }
  });
};

BrokerAgent.prototype._classQuery = function(className) {
  return this._request('_query_request', {
    '_what': 'OBJECT',
    '_schema_id': {
      '_class_name': className
    }
  });
};

function convertBuffersToStrings(data) {
  if (Array.isArray(data)) {
    data.forEach(function(object) {
      convertBuffersToStrings(object);
    });
  } else {
    Object.keys(data).forEach(function(key) {
      if (data[key] instanceof Buffer)
        data[key] = data[key].toString('utf8');

      // @todo: fix conversion to dates
      if (key.indexOf('_ts') !== -1) {
        var raw = (typeof data[key] === 'number') ? data[key] : data[key].toNumber(true);
        data[key] = new Date(raw / 1000000);
      }

      if (_.isPlainObject(data[key]))
        convertBuffersToStrings(data[key]);
    });
  }
}

BrokerAgent.prototype._getAllBrokerObjects = function(type) {
  return this._classQuery(type)
    .then(function(objects) {
      convertBuffersToStrings(objects);
      if (Array.isArray(objects)) {
        return objects.map(function(object) {
          return new BrokerObject(object);
        });
      }

      return [ new BrokerObject(objects) ];
    });
};

BrokerAgent.prototype._getBrokerObject = function(type, name) {
  return this._nameQuery(name)
    .then(function(object) {
      convertBuffersToStrings(object);
      return new BrokerObject(object);
    });
};

BrokerAgent.prototype.getBrokerInfo = function() {
  return this._getAllBrokerObjects('broker');
};

BrokerAgent.prototype.getAllExchanges = function() {
  return this._getAllBrokerObjects('exchange');
};

BrokerAgent.prototype.getExchange = function(exchangeName) {
  return this._getBrokerObject('exchange', 'org.apache.qpid.broker:exchange:' + exchangeName);
};

BrokerAgent.prototype.getCluster = function() {
  return this._getSingleObject('cluster');
};

BrokerAgent.prototype.getHaBroker = function() {
  return this._getSingleObject('habroker');
};

BrokerAgent.prototype.getAllConnections = function() {
  return this._getAllBrokerObjects('connection');
};

BrokerAgent.prototype.getConnection = function(id) {
  return this._getBrokerObject('connection', 'org.apache.qpid.broker:connection:' + id);
};

BrokerAgent.prototype.getAllSessions = function() {
  return this._getAllBrokerObjects('session');
};

BrokerAgent.prototype.getSession = function(id) {
  return this._getBrokerObject('session', 'org.apache.qpid.broker:session:' + id);
};

BrokerAgent.prototype.getAllSubscriptions = function() {
  return this._getAllBrokerObjects('subscription');
};

BrokerAgent.prototype.getSubscription = function(id) {
  return this._getBrokerObject('subscription', 'org.apache.qpid.broker:subscription:' + id);
};

BrokerAgent.prototype.getAllExchanges = function() {
  return this._getAllBrokerObjects('exchange');
};

BrokerAgent.prototype.getExchange = function(name) {
  return this._getBrokerObject('exchange', 'org.apache.qpid.broker:exchange:' + name);
};

BrokerAgent.prototype.getAllQueues = function() {
  return this._getAllBrokerObjects('queue');
};

BrokerAgent.prototype.getQueue = function(name) {
  return this._getBrokerObject('queue', 'org.apache.qpid.broker:queue:' + name);
};

BrokerAgent.prototype.getAllBindings = function() {
  return this._getAllBrokerObjects('binding');
};

BrokerAgent.prototype.getAllLinks = function() {
  return this._getAllBrokerObjects('link');
};

module.exports = BrokerAgent;
