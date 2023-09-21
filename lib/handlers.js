/**
 * @typedef {import('mdast').Blockquote} Blockquote
 * @typedef {import('mdast').Code} Code
 * @typedef {import('mdast').Delete} Delete
 * @typedef {import('mdast').Emphasis} Emphasis
 * @typedef {import('mdast').Heading} Heading
 * @typedef {import('mdast').Image} Image
 * @typedef {import('mdast').ImageReference} ImageReference
 * @typedef {import('mdast').InlineCode} InlineCode
 * @typedef {import('mdast').Link} Link
 * @typedef {import('mdast').LinkReference} LinkReference
 * @typedef {import('mdast').List} List
 * @typedef {import('mdast').ListItem} ListItem
 * @typedef {import('mdast').Paragraph} Paragraph
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').Strong} Strong
 * @typedef {import('mdast').Table} Table
 * @typedef {import('mdast').Text} Text
 * @typedef {import('./to-roff.js').Handle} Handle
 * @typedef {import('./to-roff.js').State} State
 */

import {escape} from './util/escape.js'
import {inline} from './util/inline.js'
import {macro} from './util/macro.js'
import {quote} from './util/quote.js'
import {textDecoration} from './util/text-decoration.js'
import {url} from './util/url.js'

const p = macro('P', '\n')

export const handlers = {
  blockquote,
  break: break_,
  code,
  definition,
  delete: delete_,
  emphasis,
  heading,
  image,
  imageReference,
  inlineCode,
  link,
  linkReference,
  list,
  listItem,
  paragraph,
  root,
  strong,
  table,
  text,
  thematicBreak
}

/**
 * Handle block quote.
 *
 * @satisfies {Handle}
 * @param {Blockquote} node
 *   Node.
 * @param {State} state
 *   Info passed around.
 * @returns {string}
 *   Roff.
 */
function blockquote(node, state) {
  state.level++
  const value = state.containerFlow(node)
  state.level--

  return '.RS ' + (state.level ? 4 : 0) + '\n' + value + '\n.RE 0\n'
}

/**
 * Handle break.
 *
 * @satisfies {Handle}
 * @returns {string}
 *   Roff.
 */
function break_() {
  return '\n' + macro('br') + '\n'
}

/**
 * Handle code.
 *
 * @satisfies {Handle}
 * @param {Code} node
 *   Node.
 * @returns {string}
 *   Roff.
 */
function code(node) {
  return '.P\n.RS 2\n.nf\n' + escape(node.value) + '\n.fi\n.RE'
}

/**
 * Handle definition.
 *
 * @satisfies {Handle}
 * @returns {undefined}
 *   Nothing.
 */
function definition() {}

/**
 * Handle GFM delete.
 *
 * @satisfies {Handle}
 * @param {Delete} node
 *   Node.
 * @param {State} state
 *   Info passed around.
 * @returns {string}
 *   Roff.
 */
function delete_(node, state) {
  return inline('I', node, state)
}

/**
 * Handle emphasis.
 *
 * @satisfies {Handle}
 * @param {Emphasis} node
 *   Node.
 * @param {State} state
 *   Info passed around.
 * @returns {string}
 *   Roff.
 */
function emphasis(node, state) {
  return inline('I', node, state)
}

/**
 * Handle heading.
 *
 * @satisfies {Handle}
 * @param {Heading} node
 *   Node.
 * @param {State} state
 *   Info passed around.
 * @returns {string | undefined}
 *   Roff.
 */
function heading(node, state) {
  if (node === state.mainHeading) {
    return
  }

  let value = state.containerPhrasing(node)
  const depth = node.depth + (state.increaseDepth ? 1 : 0)

  // Convert top-level section names to ALL-CAPS.
  if (depth === 2) {
    value = value.toUpperCase()
  }

  return macro(depth === 2 ? 'SH' : 'SS', quote(value))
}

/**
 * Handle image.
 *
 * @satisfies {Handle}
 * @param {Image} node
 *   Node.
 * @param {State} state
 *   Info passed around.
 * @returns {string}
 *   Roff.
 */
function image(node, state) {
  return url(node.alt || '', node.url, state)
}

/**
 * Handle image reference.
 *
 * @satisfies {Handle}
 * @param {ImageReference} node
 *   Node.
 * @param {State} state
 *   Info passed around.
 * @returns {string}
 *   Roff.
 */
function imageReference(node, state) {
  const definition = state.definitions(node.identifier)
  return url(
    node.alt || '',
    /* c8 ignore next -- verbose to test, means plugins injected references w/o definitions. */
    definition ? definition.url : '',
    state
  )
}

/**
 * Handle code (text).
 *
 * @satisfies {Handle}
 * @param {InlineCode} node
 *   Node.
 * @param {State} state
 *   Info passed around.
 * @returns {string}
 *   Roff.
 */
function inlineCode(node, state) {
  return textDecoration('B', escape(node.value), state.textStyle)
}

/**
 * Handle link.
 *
 * @satisfies {Handle}
 * @param {Link} node
 *   Node.
 * @param {State} state
 *   Info passed around.
 * @returns {string}
 *   Roff.
 */
function link(node, state) {
  return url(state.containerPhrasing(node), node.url, state)
}

/**
 * Handle link reference.
 *
 * @satisfies {Handle}
 * @param {LinkReference} node
 *   Node.
 * @param {State} state
 *   Info passed around.
 * @returns {string}
 *   Roff.
 */
function linkReference(node, state) {
  const definition = state.definitions(node.identifier)
  return url(
    state.containerPhrasing(node),
    /* c8 ignore next -- verbose to test, means plugins injected references w/o definitions. */
    definition ? definition.url : '',
    state
  )
}

/**
 * Handle list.
 *
 * @satisfies {Handle}
 * @param {List} node
 *   Node.
 * @param {State} state
 *   Info passed around.
 * @returns {string}
 *   Roff.
 */
function list(node, state) {
  const start = node.ordered ? node.start : undefined
  /** @type {Array<string>} */
  const values = []
  let index = -1

  state.level++

  while (++index < node.children.length) {
    values.push(
      listItem(
        node.children[index],
        state,
        typeof start === 'number' ? start + index + '.' : '\\(bu'
      )
    )
  }

  state.level--

  return ['.RS ' + (state.level ? 4 : 0), ...values, '.RE 0', ''].join('\n')
}

/**
 * Handle list item.
 *
 * @satisfies {Handle}
 * @param {ListItem} node
 *   Node.
 * @param {State} state
 *   Info passed around.
 * @param {string | undefined} [marker]
 *   Marker (if parent is list).
 * @returns {string}
 *   Roff.
 */
function listItem(node, state, marker = '') {
  return '.IP ' + marker + ' 4\n' + state.containerFlow(node).slice(p.length)
}

/**
 * Handle paragraph.
 *
 * @satisfies {Handle}
 * @param {Paragraph} node
 *   Node.
 * @param {State} state
 *   Info passed around.
 * @returns {string}
 *   Roff.
 */
function paragraph(node, state) {
  return macro('P', '\n' + state.containerPhrasing(node))
}

/**
 * Handle root.
 *
 * @satisfies {Handle}
 * @param {Root} node
 *   Node.
 * @param {State} state
 *   Info passed around.
 * @returns {string}
 *   Roff.
 */
function root(node, state) {
  return state.containerFlow(node)
}

/**
 * Handle strong.
 *
 * @satisfies {Handle}
 * @param {Strong} node
 *   Node.
 * @param {State} state
 *   Info passed around.
 * @returns {string}
 *   Roff.
 */
function strong(node, state) {
  return inline('B', node, state)
}

/**
 * Handle GFM table.
 *
 * @satisfies {Handle}
 * @param {Table} node
 *   Node.
 * @param {State} state
 *   Info passed around.
 * @returns {string}
 *   Roff.
 */
function table(node, state) {
  /** @type {Array<string>} */
  const result = []
  /* c8 ignore next -- always generated by remark */
  const align = node.align || []
  let index = -1

  while (++index < node.children.length) {
    const row = node.children[index]
    const cells = row.children
    /** @type {Array<string>} */
    const out = []
    let cellIndex = -1

    while (++cellIndex < align.length) {
      out.push(state.containerPhrasing(cells[cellIndex]))
    }

    result[index] = out.join('@')
  }

  /** @type {Array<string>} */
  const alignHeading = []
  /** @type {Array<string>} */
  const alignRow = []
  index = -1

  while (++index < align.length) {
    alignHeading.push('cb')
    alignRow.push((align[index] || 'l').charAt(0))
  }

  return macro(
    'TS',
    [
      '',
      'tab(@) allbox;',
      alignHeading.join(' '),
      alignRow.join(' ') + ' .',
      ...result,
      '.TE'
    ].join('\n')
  )
}

/**
 * Handle text.
 *
 * @satisfies {Handle}
 * @param {Text} node
 *   Node.
 * @returns {string}
 *   Roff.
 */
function text(node) {
  return escape(node.value.replace(/[\n ]+/g, ' '))
}

/**
 * Handle thematic break.
 *
 * @satisfies {Handle}
 * @returns {string}
 *   Roff.
 */
function thematicBreak() {
  return '\n\\(em\\(em\\(em'
}
