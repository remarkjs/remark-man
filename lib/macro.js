/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:man:compilers
 * @fileoverview Compilers to transform remark nodes to roff.
 */

'use strict';

/* Expose. */
module.exports = macro;

/* Compile a roff macro. */
function macro(name, value) {
  var val = value || '';

  if (val && val.charAt(0) !== '\n') {
    val = ' ' + val;
  }

  return '.' + name + val;
}
