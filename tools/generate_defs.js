'use strict';
var fs = require('fs'),
    xml2js = require('xml2js'),
    util = require('util');

function format(o) { return util.inspect(o).replace(/\n/g, ''); }
function extractProperties(properties) {
  var output = '  properties: [\n';
  output += properties
    .map(p => {
      delete p.$.desc;
      return '    ' + format(p.$);
    })
    .join(',\n');
  output += '\n  ]';
  return output;
}

function extractMethodArguments(args) {
  var output = 'arguments: [\n';
  output += args
    .map(a => {
      delete a.$.desc;
      return '      ' + format(a.$);
    })
    .join(',\n');
  output += '\n    ]';
  return output;
}

function extractMethods(methods) {
  var output = '  methods: [\n';
  output += methods
    .map(method => {
      delete method.$.desc;
      if (!method.hasOwnProperty('arg'))
        return '    ' + format(method.$);

      return "    { name: '" + method.$.name + "', " + extractMethodArguments(method.arg) + '}';
    })
    .join(',\n');
  output += '\n  ]';
  return output;
}

var parser = new xml2js.Parser();
fs.readFile(__dirname + '/../resources/management-schema.xml', 'utf8', function(err, data) {
  if (!!err) { return console.log(err); }
  parser.parseString(data, function (err, result) {
    if (!!err) { return console.log(err); }

    // generate the defs
    var generated = "'use strict';\nvar define_class = require('./class').define_class;\nvar c = module.exports = {};\n\n";
    result.schema.class.forEach((c) => {
      var output = 'c.' + c.$.name.toLowerCase() + " = define_class('" + c.$.name + "', {\n";

      var defs = [];
      defs.push(extractProperties(c.property));
      if (c.method) defs.push(extractMethods(c.method));
      output += defs.join(',\n');

      output += '\n});\n\n';
      generated += output;
    });

    // write the generated output
    fs.writeFile(__dirname + '/../lib/class_defs.js', generated, function(err) {
      if (!!err) return console.log(err);
      console.log('generation complete');
    });
  });
});
