/**
 * @typedef {import('../to-roff.js').TextStyle} TextStyle
 */

/**
 * Wrap a value in a text decoration.
 *
 * @param {TextStyle} enter
 * @param {string} value
 * @param {TextStyle} exit
 * @returns {string}
 */
export function textDecoration(enter, value, exit) {
  return '\\f' + enter + value + '\\f' + exit
}
