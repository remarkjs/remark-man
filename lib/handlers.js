/**
 * @typedef {import('mdast').PhrasingContent} PhrasingContent
 * @typedef {import('mdast').Content} Content
 * @typedef {import('mdast').Heading} Heading
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').Strong} Strong
 * @typedef {import('mdast').Emphasis} Emphasis
 * @typedef {import('mdast').Delete} Delete
 * @typedef {import('mdast').List} List
 * @typedef {import('mdast').Table} Table
 * @typedef {Root|Content} Node
 * @typedef {Extract<Node, import('mdast').Literal>} Literal
 * @typedef {Extract<Node, import('mdast').Parent>} Parent
 * @typedef {Extract<Node, import('mdast').Resource>} Resource
 * @typedef {Extract<Node, import('mdast').Association>} Association
 * @typedef {import('./create-compiler.js').Context} Context
 */

import {toString} from 'mdast-util-to-string'
import {escape} from './escape.js'
import {quote} from './quote.js'
import {macro} from './macro.js'

export const handlers = {
  inlineCode,
  strong: bold,
  emphasis: italic,
  delete: italic,
  break: hardBreak,
  link,
  image: link,
  heading,
  root,
  paragraph,
  thematicBreak: rule,
  blockquote,
  code,
  list,
  listItem,
  text,
  linkReference: reference,
  imageReference: reference,
  table,
  definition: noop
}

const p = macro('P', '\n')

/**
 * Wrap a value in a text decoration.
 *
 * @param {string} enter
 * @param {string} value
 * @param {string} exit
 * @returns {string}
 */
function textDecoration(enter, value, exit) {
  return '\\f' + enter + value + '\\f' + exit
}

/**
 * Wrap a node in an inline roff command.
 *
 * @param {string} decoration
 * @param {Extract<PhrasingContent, Parent>|string} node
 * @param {Context} context
 * @returns {string}
 */
function inline(decoration, node, context) {
  const exit = context.exitMarker || 'R'

  context.exitMarker = decoration

  const value =
    node && typeof node === 'object' && 'type' in node
      ? context.all(node, context).join('')
      : node

  context.exitMarker = exit

  return textDecoration(decoration, value, exit)
}

/**
 * @param {Extract<PhrasingContent, Parent>|string} node
 * @param {Context} context
 * @returns {string}
 */
function bold(node, context) {
  return inline('B', node, context)
}

/**
 * @param {Extract<PhrasingContent, Parent>|string} node
 * @param {Context} context
 * @returns {string}
 */
function italic(node, context) {
  return inline('I', node, context)
}

/**
 * @param {Literal} node
 * @param {Context} context
 * @returns {string}
 */
function inlineCode(node, context) {
  return inline('B', escape(node.value), context)
}

function hardBreak() {
  return '\n' + macro('br') + '\n'
}

function rule() {
  return '\n\\(em\\(em\\(em'
}

/**
 * @param {Parent} node
 * @param {Context} context
 * @returns {string}
 */
function paragraph(node, context) {
  return macro('P', '\n' + context.all(node, context).join(''))
}

/**
 * @param {Heading} node
 * @param {Context} context
 * @returns {string}
 */
function heading(node, context) {
  const depth = node.depth + (context.increaseDepth ? 1 : 0)
  const name = depth === 2 ? 'SH' : 'SS'

  if (node === context.mainHeading) {
    return ''
  }

  let value = context.all(node, context).join('')

  // Convert top-level section names to ALL-CAPS.
  if (name === 'SH') {
    value = value.toUpperCase()
  }

  return macro(name, quote(value))
}

/**
 * @param {Resource|Association} node
 * @param {Context} context
 * @param {string} [href]
 * @returns {string}
 */
function link(node, context, href) {
  let value =
    ('children' in node && context.all(node, context).join('')) ||
    ('alt' in node && node.alt) ||
    ''
  let url = escape(
    (typeof href === 'string' && href) || ('url' in node && node.url) || ''
  )

  if (url && url.slice(0, 'mailto:'.length) === 'mailto:') {
    url = url.slice('mailto:'.length)
  }

  const head = url.charAt(0) === '#' && context.headings[url.slice(1)]

  if (head) {
    url = '(' + escape(toString(head)) + ')'
  } else {
    if (value && escape(url) === value) {
      value = ''
    }

    if (url) {
      url = '\\(la' + escape(url) + '\\(ra'
    }
  }

  if (value) {
    value = bold(value, context)

    if (url) {
      value += ' '
    }
  }

  return value + (url ? italic(url, context) : '')
}

/**
 * @param {Association} node
 * @param {Context} context
 * @returns {string}
 */
function reference(node, context) {
  const definition = context.definitions(node.identifier)
  // Plugins could inject reference w/o definitions.
  /* c8 ignore next */
  const url = definition ? definition.url : undefined
  return link(node, context, url)
}

/**
 * @param {Literal} node
 * @returns {string}
 */
function code(node) {
  return ['.P', '.RS 2', '.nf', escape(node.value), '.fi', '.RE'].join('\n')
}

/**
 * @param {Parent} node
 * @param {Context} context
 * @returns {string}
 */
function blockquote(node, context) {
  context.level++
  const value = context.all(node, context).join('\n')
  context.level--

  return ['.RS ' + (context.level ? 4 : 0), value, '.RE 0', ''].join('\n')
}

/**
 * @param {Literal} node
 * @returns {string}
 */
function text(node) {
  return escape(node.value.replace(/[\n ]+/g, ' '))
}

/**
 * @param {List} node
 * @param {Context} context
 * @returns {string}
 */
function list(node, context) {
  const start = node.start
  /** @type {string[]} */
  const values = []
  let index = -1

  context.level++

  while (++index < node.children.length) {
    const bullet = start ? start + index + '.' : '\\(bu'
    values.push(listItem(node.children[index], context, bullet))
  }

  context.level--

  return ['.RS ' + (context.level ? 4 : 0), ...values, '.RE 0', ''].join('\n')
}

/**
 * @param {Parent} node
 * @param {Context} context
 * @param {string} bullet
 * @returns {string}
 */
function listItem(node, context, bullet) {
  return (
    '.IP ' +
    bullet +
    ' 4\n' +
    context.all(node, context).join('\n').slice(p.length)
  )
}

/**
 * @param {Table} node
 * @param {Context} context
 * @returns {string}
 */
function table(node, context) {
  // To do require it in mdast.
  /* c8 ignore next */
  const align = node.align || []
  /** @type {string[]} */
  const result = []
  let index = -1

  while (++index < node.children.length) {
    const cells = node.children[index].children
    /** @type {string[]} */
    const out = []
    let cellIndex = -1

    while (++cellIndex < align.length) {
      out.push(context.all(cells[cellIndex], context).join(''))
    }

    result[index] = out.join('@')
  }

  /** @type {string[]} */
  const alignHeading = []
  /** @type {string[]} */
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
 * Compile a `root` node.
 * This compiles a man header, and the children of `root`.
 *
 * @param {Parent} node
 * @param {Context} context
 * @returns {string}
 */
function root(node, context) {
  return context.all(node, context).join('\n')
}

function noop() {}
