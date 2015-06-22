'use strict';
var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('qmf2');

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
  this.replyTo = responseTopic || 'qmf.default.topic';
  this.nextCorrelationId = 0;
  this.requests = {};

  var self = this;
  this.client.createReceiver(this.replyTo, function(err, message) {
    if (!!err) {
      return Object.keys(self.requests).forEach(function(request) {
        self.requests[request](err);
      });
    }

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
}

BrokerAgent.prototype._sendRequest = function(opcode, content) {
  this.nextCorrelationId++;
  var correlationId = '' + this.nextCorrelationId;

  var options = {
    properties: {
      subject: 'broker',
      replyTo: this.replyTo,
      correlationId: correlationId
    },
    applicationProperties: {
      'method': 'request',
      'qmf.opcode': opcode,
      'x-amqp-0-10.app-id' : 'qmf2'
    }
  };

  // don't return the promise from send because that will call .then on
  // settle
  this.client.send(content, 'qmf.default.direct', options);

  // instead return a promise that's resolved when the correlation-id is matched
  // in the receive link defined in the ctor
  var self = this;
  var response = new Promise(function(resolve, reject) {
    self.requests[correlationId] = function(err, message) {
      if (!!err) {
        return reject(err);
      }

      if (message.body instanceof Array && message.body.length === 1) {
        resolve(message.body[0]);
      } else {
        resolve(message.body);
      }
    };
  });

  return response;
};

BrokerAgent.prototype._nameQuery = function(objectId) {
  var query = {
    '_what': 'OBJECT',
    '_object_id': {
      '_object_name': objectId
    }
  };

  return this._sendRequest('_query_request', query);
};

BrokerAgent.prototype._classQuery = function(className) {
  var query = {
    '_what': 'OBJECT',
    '_schema_id': {
      '_class_name': className
    }
  };

  return this._sendRequest('_query_request', query);
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
        data[key] = new Date(data[key].toNumber(true) / 1000000);
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
  return this._getBrokerObject('exchange', "org.apache.qpid.broker:exchange:" + exchangeName);
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
