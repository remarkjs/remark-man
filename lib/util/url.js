/**
 * @typedef {import('../to-roff.js').State} State
 */

import {toString} from 'mdast-util-to-string'
import {escape} from './escape.js'
import {textDecoration} from './text-decoration.js'

/**
 * @param {string} text
 * @param {string} href
 * @param {State} state
 * @returns {string}
 */
export function url(text, href, state) {
  let value = text
  let url = href
  const heading =
    url.charAt(0) === '#' ? state.headings.get(url.slice(1)) : undefined

  if (heading) {
    url = toString(heading)
  }

  if (url.slice(0, 'mailto:'.length) === 'mailto:') {
    url = url.slice('mailto:'.length)
  }

  url = escape(url)
  value = escape(value)

  if (url === value) {
    value = ''
  }

  const currentStyle = state.textStyle[state.textStyle.length - 1]

  return (
    (value ? textDecoration('B', value, currentStyle) : '') +
    (value && url ? ' ' : '') +
    (url
      ? textDecoration(
          'I',
          (heading ? '(' : '\\(la') + escape(url) + (heading ? ')' : '\\(ra'),
          currentStyle
        )
      : '')
  )
}
