/**
 * Wrap `value` with double quotes and escape internal double quotes.
 *
 * @param {string} value
 * @returns {string}
 */
export function quote(value) {
  return '"' + String(value).replace(/"/g, '\\"') + '"'
}
