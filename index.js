/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:man
 * @fileoverview Compile Markdown to man pages.
 */

'use strict';

/* Dependencies. */
var compiler = require('./lib/compiler.js');

/* Expose. */
module.exports = man;

/* Compile markdown to man pages. */
function man(remark, options) {
  remark.Compiler = compiler(options || {});
}
