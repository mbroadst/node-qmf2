'use strict';
var AMQPClient = require('amqp10').Client,
    Broker = require('../lib/broker-agent');

var uri = 'amqp://localhost',
    client = new AMQPClient();

var broker;
client.connect(uri)
  .then(function () {
    broker = new Broker(client);
    return broker.initialize();
  })
  .then(function() {
    return broker._getAllBrokerObjects('broker');
  })
  .then(function(response) {
    console.log(response);
    process.exit(0);
  })
  .catch(function (e) {
    console.log(typeof e);
    console.log('error: ');
    console.log(e);
    process.exit(1);
  });
