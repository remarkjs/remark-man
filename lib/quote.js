/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:man:compilers
 * @fileoverview Compilers to transform remark nodes to roff.
 */

'use strict';

/* Expose. */
module.exports = quote;

/* Wrap `value` with double quotes, and escape internal
 * double quotes. */
function quote(value) {
  return '"' + String(value).replace(/"/g, '\\"') + '"';
}
