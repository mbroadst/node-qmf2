'use strict';
var amqp = require('amqp10'),
    BrokerAgent = require('../lib/broker-agent'),
    config = require('./config'),
    expect = require('chai').expect;

var test = {};
describe('Broker', function() {
  before(function() {
    test.client = new amqp.Client();
    return test.client.connect(config.address)
      .then(function() {
        test.agent = new BrokerAgent(test.client);
        return test.agent.initialize();
      });
  });

  it('should support an echo command', function() {
    return test.agent.getAllBrokers()
      .map(function(broker) { return broker.echo({ sequence: 0, body: 'test' }); })
      .map(function(response) { expect(response).to.eql({ sequence: 0, body: 'test' }); });
  });

  it('should support a name query', function() {
    return test.agent.getQueue('test.queue')
      .then(function(queue) {
        expect(queue).to.exist;
        expect(queue.name).to.eql('test.queue');
      });
  });
});
