import {zwitch} from 'zwitch'
import {mapz} from 'mapz'
import {visit} from 'unist-util-visit'
import {toString} from 'mdast-util-to-string'
import {definitions} from 'mdast-util-definitions'
import slugs from 'github-slugger'
import months from 'months'
import {handlers} from './handlers.js'
import {escape} from './escape.js'
import {quote} from './quote.js'
import {macro} from './macro.js'

// Heading expressions.
var manExpression = /([\w_.[\]~+=@:-]+)\s*\((\d\w*)\)(?:\s*[-—–]+\s*(.*))?/

// Helpers.
var one = zwitch('type')
var all = mapz(one, {key: 'children', indices: false, gapless: true})

one.invalid = invalid
one.unknown = unknown
one.handlers = handlers

export function createCompiler(defaults) {
  Compiler.prototype.compile = compile
  Compiler.prototype.one = one
  Compiler.prototype.all = all

  return Compiler

  function Compiler(tree, file) {
    this.tree = tree
    this.file = file
  }

  function compile() {
    var tree = this.tree
    var file = this.file
    var slug = slugs()
    var config = {}
    var titles = 0
    var headings = {}
    var result
    var value
    var match
    var name
    var description

    this.level = 0
    this.definitions = definitions(tree, {commonmark: defaults.commonmark})
    this.headings = headings

    // Check if there is one or more main headings.
    visit(tree, 'heading', (node) => {
      if (node.depth === 1) {
        if (titles) {
          this.increaseDepth = true
        } else {
          this.mainHeading = node
        }

        titles++
      }

      headings[slug.slug(toString(node))] = node
    })

    if (this.mainHeading) {
      value = toString(this.mainHeading)
      match = manExpression.exec(value)

      if (match) {
        config.name = match[1]
        config.section = match[2]
        config.description = match[3]
      } else {
        config.title = value
      }
    } else if (file.stem) {
      value = file.stem.split('.')
      match = value.length > 1 && value.pop()

      if (match && match.length === 1) {
        config.section = match
        config.name = value.join('.')
      }
    }

    name = config.name || defaults.name || ''
    description =
      config.description || defaults.description || config.title || ''

    result =
      macro(
        'TH',
        [
          quote(escape(name.toUpperCase())),
          quote(config.section || defaults.section || ''),
          quote(toDate(defaults.date || new Date())),
          quote(defaults.version || ''),
          quote(defaults.manual || '')
        ].join(' ')
      ) + '\n'

    if (name) {
      result +=
        macro('SH', quote('NAME')) + '\n' + handlers.strong.call(this, name)
    }

    result += escape(name && description ? ' - ' + description : description)

    result += '\n' + this.one(tree)

    // Ensure a final eof eol is added.
    if (result.charAt(result.length - 1) !== '\n') {
      result += '\n'
    }

    return result
  }
}

// Non-nodes - Not passed by remark.
/* c8 ignore next 3 */
function invalid(node) {
  throw new Error('Expected node, not `' + node + '`')
}

// Unhandled nodes.
function unknown(node) {
  this.file.message('Cannot compile `' + node.type + '` node', node)
}

// Create a man-style date.
function toDate(date) {
  date = new Date(date)
  return months[date.getMonth()] + ' ' + date.getFullYear()
}
