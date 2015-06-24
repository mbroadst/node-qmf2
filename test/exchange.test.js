'use strict';
var AMQPClient = require('amqp10').Client,
    Broker = require('../lib/broker-agent');

var uri = 'amqp://localhost',
    client = new AMQPClient();

var broker;
client.connect(uri)
  .then(function () {
    broker = new Broker(client);
    return broker.getAllExchanges();
  })
  .then(function(exchanges) {
    console.log(exchanges);
    process.exit(0);
  })
  .catch(function (e) {
    console.log('error: ');
    console.log(e);
    process.exit(1);
  });
