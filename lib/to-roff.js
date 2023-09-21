/**
 * @typedef {import('mdast').Heading} Heading
 * @typedef {import('mdast').Parents} Parents
 * @typedef {import('mdast').PhrasingContent} PhrasingContent
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').TableCell} TableCell
 * @typedef {import('mdast').TableRow} TableRow
 * @typedef {import('mdast-util-definitions').GetDefinition} GetDefinition
 * @typedef {import('unist').Node} UnistNode
 * @typedef {import('vfile').VFile} VFile
 */

/**
 * @typedef {Exclude<Parents, PhrasingContent | TableCell | TableRow>} FlowParents
 * @typedef {Parents extends {children: Array<infer T>} ? PhrasingContent extends T ? Parents : never : never} PhrasingParents
 */

/**
 * @callback ContainerFlow
 *   Handle a parent.
 * @param {FlowParents} node
 *   mdast phrasing parent.
 * @returns {string}
 *   Serialized roff.
 *
 * @callback ContainerPhrasing
 *   Handle a parent.
 * @param {PhrasingParents} node
 *   mdast phrasing parent.
 * @returns {string}
 *   Serialized roff.
 *
 * @callback Handle
 *   Handle a particular node.
 * @param {any} node
 *   Expected mdast node.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string | undefined}
 *   Serialized roff representing `node`.
 *
 * @typedef Options
 *   Configuration.
 * @property {string | null | undefined} [name]
 *   Title of the page (optional);
 *   defaults to the main heading (`# hello-world(7)` means `'hello-world'`) or
 *   the file’s name (`hello-world.1.md` means `'hello-world'`).
 * @property {number | string | null | undefined} [section]
 *   Man section of page (optional);
 *   defaults to the main heading (`# hello-world(7)` means `7`) or the file’s
 *   name (`hello-world.1.md` means `1`).
 * @property {string | null | undefined} [description]
 *   Description of page (optional);
 *   defaults to the main heading (`# hello-world(7) -- Two common words` means
 *   `'Two common words'`).
 * @property {Readonly<Date> | number | string | null | undefined} [date]
 *   Date of page.
 *   Given to `new Date(date)` as `date`, so when `null` or `undefined`,
 *   defaults to the current date.
 *   Dates are centered in the footer line of the displayed page.
 * @property {string | null | undefined} [version]
 *   Version of page.
 *   Versions are positioned at the left of the footer line of the displayed
 *   page (or at the left on even pages and at the right on odd pages if
 *   double-sided printing is active).
 * @property {string | null | undefined} [manual]
 *   Manual of page.
 *   Manuals are centered in the header line of the displayed page.
 *
 * @typedef State
 *   Info passed around.
 * @property {ContainerFlow} containerFlow
 *   Serialize children in a flow parent.
 * @property {ContainerPhrasing} containerPhrasing
 *   Serialize children in a phrasing parent.
 * @property {GetDefinition} definitions
 *   Get a definition.
 * @property {Map<string, Heading>} headings
 *   Headings by GH slug.
 * @property {boolean} increaseDepth
 *   Whether to act as if one extra heading depth is used.
 * @property {number} level
 *   Current indent level.
 * @property {Heading | undefined} mainHeading
 *   Primary heading.
 * @property {TextStyle} textStyle
 *   Current text style.
 *
 * @typedef {'B' | 'I' | 'R'} TextStyle
 *   Text style.
 */

import GitHubSlugger from 'github-slugger'
import {definitions} from 'mdast-util-definitions'
import {toString} from 'mdast-util-to-string'
// @ts-expect-error: untyped.
import months_ from 'months'
import {visit} from 'unist-util-visit'
import {zwitch} from 'zwitch'
import {escape} from './util/escape.js'
import {macro} from './util/macro.js'
import {quote} from './util/quote.js'
import {textDecoration} from './util/text-decoration.js'
import {handlers} from './handlers.js'

/** @type {Array<string>} */
const months = months_

// Heading expressions.
const manExpression = /([\w_.[\]~+=@:-]+)\s*\((\d\w*)\)(?:\s*[-—–]+\s*(.*))?/

/** @type {Readonly<Options>} */
const emptyOptions = {}

/** @type {Handle} */
const handle = zwitch('type', {handlers, invalid, unknown})

/**
 * @param {Root} tree
 *   Tree.
 * @param {VFile} file
 *   File.
 * @param {Readonly<Options> | null | undefined} [options]
 *   Configuration (optional).
 * @returns
 *   Compiler.
 */
// eslint-disable-next-line complexity
export function toRoff(tree, file, options) {
  const settings = options || emptyOptions
  const slugger = new GitHubSlugger()
  /** @type {Record<string, string>} */
  const config = {}
  let heading1 = false

  /** @type {State} */
  const state = {
    containerFlow(node) {
      return all(node, this).join('\n')
    },
    containerPhrasing(node) {
      return all(node, this).join('')
    },
    definitions: definitions(tree),
    headings: new Map(),
    increaseDepth: false,
    level: 0,
    mainHeading: undefined,
    textStyle: 'R'
  }

  // Check if there is one or more main headings.
  visit(tree, 'heading', function (node) {
    if (node.depth === 1) {
      if (heading1) {
        state.increaseDepth = true
      } else {
        state.mainHeading = node
      }

      heading1 = true
    }

    state.headings.set(slugger.slug(toString(node)), node)
  })

  if (state.mainHeading) {
    const value = toString(state.mainHeading)
    const match = manExpression.exec(value)

    if (match) {
      config.name = match[1]
      config.section = match[2]
      config.description = match[3]
    } else {
      config.title = value
    }
  } else if (file.stem) {
    const value = file.stem.split('.')
    const match = value.length > 1 && value.pop()

    if (match && match.length === 1) {
      config.section = match
      config.name = value.join('.')
    }
  }

  const name = config.name || settings.name || ''
  const description =
    config.description || settings.description || config.title || ''

  let result =
    macro(
      'TH',
      [
        quote(escape(name.toUpperCase())),
        quote(String(config.section || settings.section || '')),
        quote(toDate(settings.date || new Date())),
        quote(settings.version || ''),
        quote(settings.manual || '')
      ].join(' ')
    ) + '\n'

  if (name) {
    result +=
      macro('SH', quote('NAME')) + '\n' + textDecoration('B', escape(name), 'R')
  }

  result += escape(name && description ? ' - ' + description : description)

  result += '\n' + handle(tree, state)

  // Ensure a final eof eol is added.
  if (result.charAt(result.length - 1) !== '\n') {
    result += '\n'
  }

  return result
}

/**
 * Non-nodes.
 *
 * @param {unknown} node
 */
/* c8 ignore next 3 -- remark produces valid nodes. */
function invalid(node) {
  throw new Error('Expected node, not `' + node + '`')
}

/**
 * Unknown nodes.
 *
 * @param {unknown} value
 */
function unknown(value) {
  // Runtime guarantees it has a `type`.
  const node = /** @type {UnistNode} */ (value)
  throw new Error('Cannot compile `' + node.type + '` node')
}

/**
 * Create a man-style date.
 *
 * @param {Date | string | number} value
 * @returns {string}
 */
function toDate(value) {
  const date = new Date(value)
  return months[date.getMonth()] + ' ' + date.getFullYear()
}

/**
 * Serialize children.
 *
 * @param {Parents} node
 *   Parent.
 * @param {State} state
 *   Info passed around.
 * @returns {Array<string>}
 *   Chunks for each child.
 */
function all(node, state) {
  const children = node.children
  /** @type {Array<string>} */
  const results = []
  let index = -1

  while (++index < children.length) {
    const result = handle(children[index], state)
    if (result) results.push(result)
  }

  return results
}
