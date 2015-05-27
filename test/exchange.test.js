'use strict';
var AMQPClient = require('amqp10').Client,
    Broker = require('../lib/broker');

var uri = 'amqp://system:manager@localhost/',
    client = new AMQPClient();
//    broker = new Broker(client);

var broker;
client.connect(uri)
  .then(function () {
    broker = new Broker(client);
//    return broker.getExchange('hive.inventory.guest');
    return broker.getAllExchanges();

  })
  .then(function(exchange) {
    console.log(exchange);
    process.exit(0);
  })
  .catch(function (e) {
    console.log('error: ');
    console.log(e);
    process.exit(1);
  });
