'use strict';

var compiler = require('./lib/compiler.js');

module.exports = man;

function man(remark, options) {
  remark.Compiler = compiler(options || {});
}
