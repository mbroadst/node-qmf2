'use strict';

var bluebird    = require('bluebird'),
    AMQPClient  = require('amqp10');

bluebird.promisifyAll(AMQPClient.prototype);

var uri = 'amqp://system:manager@192.168.1.106/';


var client = new AMQPClient();
client.connectAsync(uri)
  .then(function () {
    // register listener
    client.receive('my.response.topic', function (err, payload, options) {
      console.log(payload);
      process.exit(0);
    });

    // send QMF2 message
    var message = {
      "_what": "OBJECT",
      "_schema_id": {
        "_class_name": "broker"
      }
    };

    return client.sendAsync(message, "qmf.default.direct", {
      applicationProperties: {
        'x-amqp-0-10.app-id': 'qmf2',
        'qmf.opcode': '_query_request'
      },
      properties: {
        contentType: 'amqp/map',
        replyTo: 'my.response.topic',
        subject: 'broker'
      }
    });
  })
  .catch(function (e) {
    console.log('error: ');
    console.log(e);
  });
