'use strict';
var Agent = require('./agent'),
    util = require('util');

function BrokerAgent(client, responseTopic) {
  Agent.call(this, 'broker', client, responseTopic);
}
util.inherits(BrokerAgent, Agent);

BrokerAgent.prototype.getAllBrokers = function() {
  return this._getObjects('broker');
};

BrokerAgent.prototype.getBrokerInfo = BrokerAgent.prototype.getAllBrokers;   // deprecated

BrokerAgent.prototype.getAllExchanges = function() {
  return this._getObjects('exchange');
};

BrokerAgent.prototype.getExchange = function(exchangeName) {
  return this._getObject('exchange', 'org.apache.qpid.broker:exchange:' + exchangeName);
};

BrokerAgent.prototype.getCluster = function() {
  return this._getObjects('cluster')[0];
};

BrokerAgent.prototype.getHaBroker = function() {
  return this._getObjects('habroker')[0];
};

BrokerAgent.prototype.getAllConnections = function() {
  return this._getObjects('connection');
};

BrokerAgent.prototype.getConnection = function(id) {
  return this._getObject('connection', 'org.apache.qpid.broker:connection:' + id);
};

BrokerAgent.prototype.getAllSessions = function() {
  return this._getObjects('session');
};

BrokerAgent.prototype.getSession = function(id) {
  return this._getObject('session', 'org.apache.qpid.broker:session:' + id);
};

BrokerAgent.prototype.getAllSubscriptions = function() {
  return this._getObjects('subscription');
};

BrokerAgent.prototype.getSubscription = function(id) {
  return this._getObject('subscription', 'org.apache.qpid.broker:subscription:' + id);
};

BrokerAgent.prototype.getAllExchanges = function() {
  return this._getObjects('exchange');
};

BrokerAgent.prototype.getExchange = function(name) {
  return this._getObject('exchange', 'org.apache.qpid.broker:exchange:' + name);
};

BrokerAgent.prototype.getAllQueues = function() {
  return this._getObjects('queue');
};

BrokerAgent.prototype.getQueue = function(name) {
  return this._getObject('queue', 'org.apache.qpid.broker:queue:' + name);
};

BrokerAgent.prototype.getAllBindings = function() {
  return this._getObjects('binding');
};

BrokerAgent.prototype.getAllLinks = function() {
  return this._getObjects('link');
};

module.exports = BrokerAgent;
