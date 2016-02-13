'use strict';
var amqp = require('amqp10'),
    BrokerAgent = require('../lib/broker-agent'),
    errors = require('../lib/errors'),
    config = require('./config'),
    chai = require('chai'),
    expect = require('chai').expect;

chai.use(require('chai-as-promised'));

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

  it('should support a timeout parameter', function() {
    var promise = test.agent._getObjects('queue', { timeout: 1 })
      .then(function(queues) { expect(queues, 'This should not happen').to.eql(false); });
    expect(promise).to.eventually.be.rejectedWith(errors.TimeoutError);
  });

  it('should support getBrokerInfo alias', function() {
    return test.agent.getBrokerInfo()
      .then(function(info) { expect(info).to.exist; });
  });

  it('should support JSON.stringify for class instances', function() {
    return test.agent.getAllExchanges()
      .then(function(exchanges) {
        var test = JSON.stringify(exchanges);
        expect(test).to.exist;
      });
  });

});
