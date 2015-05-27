'use strict';
var _ = require('lodash'),
    Promise = require('bluebird'),
    uuid = require('uuid');

function Broker(client) {
  this.client = client;
  this.replyTo = 'my.response.topic';
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
      console.log('[DEBUG] message lacks correlation-id');
      return;
    }

    if (!self.requests.hasOwnProperty(correlationId)) {
      console.log('[DEBUG] invalid correlation-id');
      return;
    }

    // complete request
    self.requests[correlationId](null, message);
    delete self.requests[correlationId];
  });
}

Broker.prototype._sendRequest = function(opcode, content) {
  var self = this;
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

Broker.prototype._nameQuery = function(objectId) {
  var query = {
    '_what': 'OBJECT',
    '_object_id': {
      '_object_name': objectId
    }
  };

  return this._sendRequest('_query_request', query);
};

Broker.prototype._classQuery = function(className) {
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

      if (_.isPlainObject(data[key]))
        convertBuffersToStrings(data[key]);
    });
  }
}

Broker.prototype._getAllBrokerObjects = function(type) {
  return this._classQuery(type)
    .then(function(objects) {
      convertBuffersToStrings(objects);
      return objects;
    });
};

Broker.prototype._getBrokerObject = function(type, name) {
  return this._nameQuery(name)
    .then(function(object) {
      convertBuffersToStrings(object);
      return object;
    });
};

Broker.prototype.getAllExchanges = function() {
  return this._getAllBrokerObjects('exchange');
}

Broker.prototype.getExchange = function(exchangeName) {
  return this._getBrokerObject('exchange', "org.apache.qpid.broker:exchange:" + exchangeName);
};

function BrokerObject(broker, content) {
  this._broker = broker;
  this._content = content;
}

BrokerObject.prototype.objectId = function() {
  return this._content['_object_id']['_object_name'];
};

BrokerObject.prototype.attributes = function() {
  return this._content['_values'];
};

BrokerObject.prototype.createTime = function() {
  return this._content['_create_ts'];
};

BrokerObject.prototype.deleteTime = function() {
  return this._content['_delete_ts'];
};

BrokerObject.prototype.updateTime = function() {
  return this._content['_update_ts'];
};

BrokerObject.prototype.update = function() {
  // refresh data from Broker
};


module.exports = Broker;

