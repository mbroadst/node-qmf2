'use strict';
var AMQPClient = require('amqp10').Client;

var uri = 'amqp://system:manager@localhost/',
    client = new AMQPClient();

client.connect(uri)
  .then(function () {
    return client.createReceiver('#', function(err, message) {
      if (!!err) {
        console.log("error:");
        console.log(err);
      } else {
        console.log("received: ");
        console.log(message);
      }

      process.exit(1);
    });
  })
  .then(function(link) {
    console.log(link);
    return client.send('testing', 'my.response.topic', {
      properties: {
        correlationId: 42
      }
    });
  })
  .catch(function (e) {
    console.log('error: ');
    console.log(e);
    process.exit(1);
  });
