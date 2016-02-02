'use strict';
var define_class = require('./class').define_class;
var c = module.exports = {};

c.system = define_class('System', {
  properties: [
    { name: 'systemId', index: 'y', type: 'uuid', access: 'RC' },
    { name: 'osName', type: 'sstr', access: 'RO' },
    { name: 'nodeName', type: 'sstr', access: 'RO' },
    { name: 'release', type: 'sstr', access: 'RO' },
    { name: 'version', type: 'sstr', access: 'RO' },
    { name: 'machine', type: 'sstr', access: 'RO' }
  ]
});

c.memory = define_class('Memory', {
  properties: [
    { name: 'name', type: 'sstr', access: 'RC', index: 'y' },
    { name: 'malloc_arena',  type: 'uint64',  access: 'RO',  optional: 'y' },
    { name: 'malloc_ordblks',  type: 'uint64',  access: 'RO',  optional: 'y' },
    { name: 'malloc_hblks',  type: 'uint64',  access: 'RO',  optional: 'y' },
    { name: 'malloc_hblkhd',  type: 'uint64',  access: 'RO',  optional: 'y' },
    { name: 'malloc_uordblks',  type: 'uint64',  access: 'RO',  optional: 'y' },
    { name: 'malloc_fordblks',  type: 'uint64',  access: 'RO',  optional: 'y' },
    { name: 'malloc_keepcost',  type: 'uint64',  access: 'RO',  optional: 'y' }
  ]
});

c.broker = define_class('Broker', {
  properties: [
    { name: 'name', type: 'sstr', access: 'RC', index: 'y' },
    { name: 'systemRef',  type: 'objId',  references: 'System',  access: 'RO',  parentRef: 'y' },
    { name: 'port', type: 'uint16', access: 'RO' },
    { name: 'workerThreads', type: 'uint16', access: 'RO' },
    { name: 'maxConns', type: 'uint16', access: 'RO' },
    { name: 'connBacklog', type: 'uint16', access: 'RO' },
    { name: 'stagingThreshold', type: 'uint32', access: 'RO' },
    { name: 'mgmtPublish', type: 'bool', access: 'RO' },
    { name: 'mgmtPubInterval',  type: 'uint16',  access: 'RW',  unit: 'second',  min: '1' },
    { name: 'version', type: 'sstr', access: 'RO' },
    { name: 'dataDir', type: 'lstr', access: 'RO', optional: 'y' }
  ],
  methods: [
    { name: 'echo', arguments: [
      { name: 'sequence', dir: 'IO', type: 'uint32' },
      { name: 'body', dir: 'IO', type: 'lstr' }
    ]},
    { name: 'connect', arguments: [
      { name: 'host', dir: 'I', type: 'sstr' },
      { name: 'port', dir: 'I', type: 'uint32' },
      { name: 'durable', dir: 'I', type: 'bool' },
      { name: 'authMechanism', dir: 'I', type: 'sstr' },
      { name: 'username', dir: 'I', type: 'sstr' },
      { name: 'password', dir: 'I', type: 'sstr' },
      { name: 'transport', dir: 'I', type: 'sstr' }
    ]},
    { name: 'queueMoveMessages', arguments: [
      { name: 'srcQueue', dir: 'I', type: 'sstr' },
      { name: 'destQueue', dir: 'I', type: 'sstr' },
      { name: 'qty', dir: 'I', type: 'uint32' },
      { name: 'filter', dir: 'I', type: 'map' }
    ]},
    { name: 'setLogLevel', arguments: [
      { name: 'level', dir: 'I', type: 'sstr' }
    ]},
    { name: 'getLogLevel', arguments: [
      { name: 'level', dir: 'O', type: 'sstr' }
    ]},
    { name: 'getTimestampConfig', arguments: [
      { name: 'receive', dir: 'O', type: 'bool' }
    ]},
    { name: 'setTimestampConfig', arguments: [
      { name: 'receive', dir: 'I', type: 'bool' }
    ]},
    { name: 'create', arguments: [
      { name: 'type', dir: 'I', type: 'sstr' },
      { name: 'name', dir: 'I', type: 'sstr' },
      { name: 'properties', dir: 'I', type: 'map' },
      { name: 'strict', dir: 'I', type: 'bool' }
    ]},
    { name: 'delete', arguments: [
      { name: 'type', dir: 'I', type: 'sstr' },
      { name: 'name', dir: 'I', type: 'sstr' },
      { name: 'options', dir: 'I', type: 'map' }
    ]},
    { name: 'query', arguments: [
      { name: 'type', dir: 'I', type: 'sstr' },
      { name: 'name', dir: 'I', type: 'sstr' },
      { name: 'results', dir: 'O', type: 'map' }
    ]},
    { name: 'getLogHiresTimestamp', arguments: [
      { name: 'logHires', dir: 'O', type: 'bool' }
    ]},
    { name: 'setLogHiresTimestamp', arguments: [
      { name: 'logHires', dir: 'I', type: 'bool' }
    ]},
    { name: 'queueRedirect', arguments: [
      { name: 'sourceQueue', dir: 'I', type: 'sstr' },
      { name: 'targetQueue', dir: 'I', type: 'sstr' }
    ]},
    { name: 'shutdown' }
  ]
});

c.agent = define_class('Agent', {
  properties: [
    { name: 'connectionRef',  type: 'objId',  references: 'Connection',  access: 'RO',  index: 'y' },
    { name: 'label', type: 'sstr', access: 'RO' },
    { name: 'registeredTo',  type: 'objId',  references: 'Broker',  access: 'RO' },
    { name: 'systemId', type: 'uuid', access: 'RO' },
    { name: 'brokerBank', type: 'uint32', access: 'RO' },
    { name: 'agentBank', type: 'uint32', access: 'RO' }
  ]
});

c.vhost = define_class('Vhost', {
  properties: [
    { name: 'brokerRef',  type: 'objId',  references: 'Broker',  access: 'RC',  index: 'y',  parentRef: 'y' },
    { name: 'name', type: 'sstr', access: 'RC', index: 'y' },
    { name: 'federationTag', type: 'sstr', access: 'RO' }
  ]
});

c.queue = define_class('Queue', {
  properties: [
    { name: 'vhostRef',  type: 'objId',  references: 'Vhost',  access: 'RC',  index: 'y',  parentRef: 'y' },
    { name: 'name', type: 'sstr', access: 'RC', index: 'y' },
    { name: 'durable', type: 'bool', access: 'RC' },
    { name: 'autoDelete', type: 'bool', access: 'RC' },
    { name: 'exclusive', type: 'bool', access: 'RO' },
    { name: 'arguments', type: 'map', access: 'RO' },
    { name: 'altExchange',  type: 'objId',  references: 'Exchange',  access: 'RO',  optional: 'y' }
  ],
  methods: [
    { name: 'purge', arguments: [
      { name: 'request', dir: 'I', type: 'uint32' },
      { name: 'filter', dir: 'I', type: 'map' }
    ]},
    { name: 'reroute', arguments: [
      { name: 'request', dir: 'I', type: 'uint32' },
      { name: 'useAltExchange', dir: 'I', type: 'bool' },
      { name: 'exchange', dir: 'I', type: 'sstr' },
      { name: 'filter', dir: 'I', type: 'map' }
    ]}
  ]
});

c.exchange = define_class('Exchange', {
  properties: [
    { name: 'vhostRef',  type: 'objId',  references: 'Vhost',  access: 'RC',  index: 'y',  parentRef: 'y' },
    { name: 'name', type: 'sstr', access: 'RC', index: 'y' },
    { name: 'type', type: 'sstr', access: 'RO' },
    { name: 'durable', type: 'bool', access: 'RO' },
    { name: 'autoDelete', type: 'bool', access: 'RO' },
    { name: 'altExchange',  type: 'objId',  references: 'Exchange',  access: 'RO',  optional: 'y' },
    { name: 'arguments', type: 'map', access: 'RO' }
  ]
});

c.binding = define_class('Binding', {
  properties: [
    { name: 'exchangeRef',  type: 'objId',  references: 'Exchange',  access: 'RC',  index: 'y',  parentRef: 'y' },
    { name: 'queueRef',  type: 'objId',  references: 'Queue',  access: 'RC',  index: 'y' },
    { name: 'bindingKey', type: 'lstr', access: 'RC', index: 'y' },
    { name: 'arguments', type: 'map', access: 'RC' },
    { name: 'origin', type: 'sstr', access: 'RO', optional: 'y' }
  ]
});

c.subscription = define_class('Subscription', {
  properties: [
    { name: 'sessionRef',  type: 'objId',  references: 'Session',  access: 'RC',  index: 'y',  parentRef: 'y' },
    { name: 'queueRef',  type: 'objId',  references: 'Queue',  access: 'RC',  index: 'y' },
    { name: 'name', type: 'sstr', access: 'RC', index: 'y' },
    { name: 'browsing', type: 'bool', access: 'RC' },
    { name: 'acknowledged', type: 'bool', access: 'RC' },
    { name: 'exclusive', type: 'bool', access: 'RC' },
    { name: 'creditMode', type: 'sstr', access: 'RO' },
    { name: 'arguments', type: 'map', access: 'RC' }
  ]
});

c.connection = define_class('Connection', {
  properties: [
    { name: 'vhostRef',  type: 'objId',  references: 'Vhost',  access: 'RC',  index: 'y',  parentRef: 'y' },
    { name: 'address', type: 'sstr', access: 'RC', index: 'y' },
    { name: 'incoming', type: 'bool', access: 'RC' },
    { name: 'SystemConnection', type: 'bool', access: 'RC' },
    { name: 'userProxyAuth', type: 'bool', access: 'RO' },
    { name: 'federationLink', type: 'bool', access: 'RO' },
    { name: 'authIdentity', type: 'sstr', access: 'RO' },
    { name: 'remoteProcessName',  type: 'lstr',  access: 'RO',  optional: 'y' },
    { name: 'remotePid', type: 'uint32', access: 'RO', optional: 'y' },
    { name: 'remoteParentPid',  type: 'uint32',  access: 'RO',  optional: 'y' },
    { name: 'shadow', type: 'bool', access: 'RO' },
    { name: 'saslMechanism', type: 'sstr', access: 'RO' },
    { name: 'saslSsf', type: 'uint16', access: 'RO' },
    { name: 'remoteProperties', type: 'map', access: 'RO' },
    { name: 'protocol', type: 'sstr', access: 'RC' }
  ],
  methods: [
    { name: 'close' }
  ]
});

c.incoming = define_class('Incoming', {
  properties: [
    { name: 'sessionRef',  type: 'objId',  references: 'Session',  access: 'RC',  parentRef: 'y' },
    { name: 'containerid', type: 'sstr', access: 'RC', index: 'y' },
    { name: 'name', type: 'sstr', access: 'RC', index: 'y' },
    { name: 'source', type: 'sstr', access: 'RC' },
    { name: 'target', type: 'sstr', access: 'RC' },
    { name: 'domain', type: 'sstr', access: 'RC' }
  ]
});

c.outgoing = define_class('Outgoing', {
  properties: [
    { name: 'sessionRef',  type: 'objId',  references: 'Session',  access: 'RC',  parentRef: 'y' },
    { name: 'containerid', type: 'sstr', access: 'RC', index: 'y' },
    { name: 'name', type: 'sstr', access: 'RC', index: 'y' },
    { name: 'source', type: 'sstr', access: 'RC' },
    { name: 'target', type: 'sstr', access: 'RC' },
    { name: 'domain', type: 'sstr', access: 'RC' }
  ]
});

c.domain = define_class('Domain', {
  properties: [
    { name: 'name', type: 'sstr', access: 'RC', index: 'y' },
    { name: 'durable', type: 'bool', access: 'RC' },
    { name: 'url', type: 'sstr', access: 'RO' },
    { name: 'mechanisms', type: 'sstr', access: 'RO' },
    { name: 'username', type: 'sstr', access: 'RO' },
    { name: 'password', type: 'sstr', access: 'RO' }
  ]
});

c.topic = define_class('Topic', {
  properties: [
    { name: 'name', type: 'sstr', access: 'RC', index: 'y' },
    { name: 'exchangeRef',  type: 'objId',  references: 'Exchange',  access: 'RC' },
    { name: 'durable', type: 'bool', access: 'RC' },
    { name: 'properties', type: 'map', access: 'RO' }
  ]
});

c.queuepolicy = define_class('QueuePolicy', {
  properties: [
    { name: 'name', type: 'sstr', access: 'RC', index: 'y' },
    { name: 'properties', type: 'map', access: 'RO' }
  ]
});

c.topicpolicy = define_class('TopicPolicy', {
  properties: [
    { name: 'name', type: 'sstr', access: 'RC', index: 'y' },
    { name: 'properties', type: 'map', access: 'RO' }
  ]
});

c.link = define_class('Link', {
  properties: [
    { name: 'vhostRef',  type: 'objId',  references: 'Vhost',  access: 'RC',  index: 'y',  parentRef: 'y' },
    { name: 'name', type: 'sstr', access: 'RC', index: 'y' },
    { name: 'host', type: 'sstr', access: 'RO' },
    { name: 'port', type: 'uint16', access: 'RO' },
    { name: 'transport', type: 'sstr', access: 'RO' },
    { name: 'durable', type: 'bool', access: 'RC' },
    { name: 'connectionRef',  type: 'objId',  references: 'Connection',  access: 'RO' }
  ],
  methods: [
    { name: 'close' },
    { name: 'bridge', arguments: [
      { name: 'durable', dir: 'I', type: 'bool' },
      { name: 'src', dir: 'I', type: 'sstr' },
      { name: 'dest', dir: 'I', type: 'sstr' },
      { name: 'key', dir: 'I', type: 'lstr' },
      { name: 'tag', dir: 'I', type: 'sstr' },
      { name: 'excludes', dir: 'I', type: 'sstr' },
      { name: 'srcIsQueue', dir: 'I', type: 'bool' },
      { name: 'srcIsLocal', dir: 'I', type: 'bool' },
      { name: 'dynamic', dir: 'I', type: 'bool' },
      { name: 'sync', dir: 'I', type: 'uint16' },
      { name: 'credit',  dir: 'I',  type: 'uint32',  default: '0xFFFFFFFF' }
    ]}
  ]
});

c.bridge = define_class('Bridge', {
  properties: [
    { name: 'linkRef',  type: 'objId',  references: 'Link',  access: 'RC',  index: 'y',  parentRef: 'y' },
    { name: 'name', type: 'sstr', access: 'RC', index: 'y' },
    { name: 'channelId', type: 'uint16', access: 'RO' },
    { name: 'durable', type: 'bool', access: 'RC' },
    { name: 'src', type: 'sstr', access: 'RC' },
    { name: 'dest', type: 'sstr', access: 'RC' },
    { name: 'key', type: 'lstr', access: 'RC' },
    { name: 'srcIsQueue', type: 'bool', access: 'RC' },
    { name: 'srcIsLocal', type: 'bool', access: 'RC' },
    { name: 'tag', type: 'sstr', access: 'RC' },
    { name: 'excludes', type: 'sstr', access: 'RC' },
    { name: 'dynamic', type: 'bool', access: 'RC' },
    { name: 'sync', type: 'uint16', access: 'RC' },
    { name: 'credit', type: 'uint32', access: 'RC' }
  ],
  methods: [
    { name: 'close' }
  ]
});

c.session = define_class('Session', {
  properties: [
    { name: 'vhostRef',  type: 'objId',  references: 'Vhost',  access: 'RC',  index: 'y',  parentRef: 'y' },
    { name: 'name', type: 'sstr', access: 'RC', index: 'y' },
    { name: 'fullName', type: 'lstr', access: 'RO', optional: 'y' },
    { name: 'channelId', type: 'uint16', access: 'RO' },
    { name: 'connectionRef',  type: 'objId',  references: 'Connection',  access: 'RO' },
    { name: 'detachedLifespan',  type: 'uint32',  access: 'RO',  unit: 'second' },
    { name: 'attached', type: 'bool', access: 'RO' },
    { name: 'expireTime',  type: 'absTime',  access: 'RO',  optional: 'y' },
    { name: 'maxClientRate',  type: 'uint32',  access: 'RO',  unit: 'msgs/sec',  optional: 'y' }
  ],
  methods: [
    { name: 'solicitAck' },
    { name: 'detach' },
    { name: 'resetLifespan' },
    { name: 'close' }
  ]
});

c.managementsetupstate = define_class('ManagementSetupState', {
  properties: [
    { name: 'objectNum', type: 'uint64', access: 'RO' },
    { name: 'bootSequence', type: 'uint16', access: 'RO' }
  ]
});

