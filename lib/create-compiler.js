/**
 * @typedef {import('unist').Node} UnistNode
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').Content} Content
 * @typedef {import('mdast').Heading} Heading
 * @typedef {import('vfile').VFile} VFile
 * @typedef {import('../index.js').Options} Options
 * @typedef {Extract<Root|Content, import('mdast').Parent>} Parent
 *
 * @typedef Context
 * @property {VFile} file
 * @property {typeof all} all
 * @property {typeof one} one
 * @property {number} level
 * @property {boolean} increaseDepth
 * @property {Heading|undefined} mainHeading
 * @property {Record<string, Heading>} headings
 * @property {ReturnType<definitions>} definitions
 * @property {string|undefined} [exitMarker]
 */

import {zwitch} from 'zwitch'
import {visit} from 'unist-util-visit'
import {toString} from 'mdast-util-to-string'
import {definitions} from 'mdast-util-definitions'
import GitHubSlugger from 'github-slugger'
/** @type {string[]} */
// @ts-expect-error: untyped.
import months from 'months'
import {handlers} from './handlers.js'
import {escape} from './escape.js'
import {quote} from './quote.js'
import {macro} from './macro.js'

// Heading expressions.
const manExpression = /([\w_.[\]~+=@:-]+)\s*\((\d\w*)\)(?:\s*[-—–]+\s*(.*))?/

// Helpers.
const one = zwitch('type', {
  invalid,
  // @ts-expect-error: fine.
  unknown,
  handlers
})

/**
 * @param {Parent} node
 * @param {Context} context
 * @returns {string[]}
 */
function all(node, context) {
  const children = node.children
  /** @type {string[]} */
  const results = []
  let index = -1

  while (++index < children.length) {
    /** @type {string | undefined} */
    const result = one(children[index], context)
    if (result) results.push(result)
  }

  return results
}

/**
 * @param {Options} defaults
 */
export function createCompiler(defaults) {
  /** @type {import('unified').CompilerFunction<Root, string>} */
  // eslint-disable-next-line complexity
  return (tree, file) => {
    const slug = new GitHubSlugger()
    const config = {}
    /** @type {Record<string, Heading>} */
    const headings = {}
    let titles = 0

    /** @type {Context} */
    const context = {
      file,
      level: 0,
      definitions: definitions(tree),
      headings,
      all,
      one,
      increaseDepth: false,
      mainHeading: undefined
    }

    // Check if there is one or more main headings.
    visit(tree, 'heading', (node) => {
      if (node.depth === 1) {
        if (titles) {
          context.increaseDepth = true
        } else {
          context.mainHeading = node
        }

        titles++
      }

      headings[slug.slug(toString(node))] = node
    })

    if (context.mainHeading) {
      const value = toString(context.mainHeading)
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

    const name = config.name || defaults.name || ''
    const description =
      config.description || defaults.description || config.title || ''

    let result =
      macro(
        'TH',
        [
          quote(escape(name.toUpperCase())),
          quote(String(config.section || defaults.section || '')),
          quote(toDate(defaults.date || new Date())),
          quote(defaults.version || ''),
          quote(defaults.manual || '')
        ].join(' ')
      ) + '\n'

    if (name) {
      result +=
        macro('SH', quote('NAME')) + '\n' + handlers.strong(name, context)
    }

    result += escape(name && description ? ' - ' + description : description)

    result += '\n' + context.one(tree, context)

    // Ensure a final eof eol is added.
    if (result.charAt(result.length - 1) !== '\n') {
      result += '\n'
    }

    return result
  }
}

/**
 * Non-nodes - Not passed by remark.
 *
 * @param {unknown} node
 */
/* c8 ignore next 3 */
function invalid(node) {
  throw new Error('Expected node, not `' + node + '`')
}

/**
 * Unhandled nodes.
 *
 * @param {UnistNode} node
 * @param {Context} context
 */
function unknown(node, context) {
  context.file.message('Cannot compile `' + node.type + '` node', node)
}

/**
 * Create a man-style date.
 *
 * @param {Date|string|number} date
 * @returns {string}
 */
function toDate(date) {
  date = new Date(date)
  return months[date.getMonth()] + ' ' + date.getFullYear()
}
