import {groffEscape} from 'groff-escape'

const own = {}.hasOwnProperty

/** @type {Record<string, string>} */
const escapes = {
  '\\': 'rs',
  '[': 'lB',
  ']': 'rB'
}

const expression = init()

/**
 * Escape a value for roff output.
 *
 * @param {string} value
 * @returns {string}
 */
export function escape(value) {
  return value.replace(expression, ($0) => '\\[' + escapes[$0] + ']')
}

// Create a regex from the escapes.
function init() {
  const keys = ['\\\\', '\\[', '\\]']
  /** @type {keyof groffEscape} */
  let key

  for (key in groffEscape) {
    if (own.call(groffEscape, key)) {
      keys.push(key)
      escapes[key] = groffEscape[key]
    }
  }

  return new RegExp(
    keys
      .sort(
        /** Longest first. */
        (a, b) => (a.length > b.length ? -1 : 1)
      )
      .join('|'),
    'g'
  )
}
