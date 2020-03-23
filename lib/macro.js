'use strict'

module.exports = macro

// Compile a roff macro.
function macro(name, value) {
  var clean = value || ''

  if (clean && clean.charAt(0) !== '\n') {
    clean = ' ' + clean
  }

  return '.' + name + clean
}
