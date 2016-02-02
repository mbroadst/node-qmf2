'use strict';
var amqp = require('amqp10'),
    BrokerAgent = require('../lib/broker-agent'),
    config = require('./config'),
    expect = require('chai').expect;

var test = {};
describe('Broker', () => {
  before(() => {
    test.client = new amqp.Client();
    return test.client.connect(config.address)
      .then(() => {
        test.agent = new BrokerAgent(test.client);
        return test.agent.initialize();
      });
  });

  it('should support an echo command', () => {
    return test.agent.getAllBrokers()
      .then((brokers) => brokers.map(broker => broker.echo({ sequence: 0, body: 'test' })))
      .map(response => {
        expect(response).to.eql({ sequence: 0, body: 'test' });
      });
  });
});
