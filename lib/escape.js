import {groffEscape} from 'groff-escape'

const own = {}.hasOwnProperty

const escapes = {
  '\\': 'rs',
  '[': 'lB',
  ']': 'rB'
}

const expression = init()

// Escape a value for roff output.
export function escape(value) {
  return value.replace(expression, ($0) => '\\[' + escapes[$0] + ']')
}

// Create a regex from the escapes.
function init() {
  const keys = ['\\\\', '\\[', '\\]']
  let key

  for (key in groffEscape) {
    if (own.call(groffEscape, key)) {
      keys.push(key)
      escapes[key] = groffEscape[key]
    }
  }

  return new RegExp(keys.sort(longest).join('|'), 'g')
}

// Longest first.
function longest(a, b) {
  return a.length > b.length ? -1 : 1
}
