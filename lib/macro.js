/**
 * Compile a roff macro.
 *
 * @param {string} name
 * @param {string} [value='']
 * @returns {string}
 */
export function macro(name, value = '') {
  if (value && value.charAt(0) !== '\n') {
    value = ' ' + value
  }

  return '.' + name + value
}
