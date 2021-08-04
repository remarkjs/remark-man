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
  escape: text, // To do: remove next major
  linkReference: reference,
  imageReference: reference,
  table,
  definition: noop
}

var mailto = 'mailto:'
var p = macro('P', '\n')

// Wrap a value in a text decoration.
function textDecoration(enter, value, exit) {
  /* istanbul ignore next - Previously, remark sometimes gave empty nodes */
  var clean = String(value || '')
  return '\\f' + enter + clean + '\\f' + exit
}

// Wrap a node in an inline roff command.
function inline(decoration, node, compiler) {
  var exit = compiler.exitMarker || 'R'
  var value = node

  compiler.exitMarker = decoration

  if (node && node.type) {
    value = compiler.all(node).join('')
  }

  compiler.exitMarker = exit

  return textDecoration(decoration, value, exit)
}

function bold(node) {
  return inline('B', node, this)
}

function italic(node) {
  return inline('I', node, this)
}

function inlineCode(node) {
  return inline('B', escape(node.value), this)
}

function hardBreak() {
  return '\n' + macro('br') + '\n'
}

function rule() {
  return '\n\\(em\\(em\\(em'
}

function paragraph(node) {
  return macro('P', '\n' + this.all(node).join(''))
}

function heading(node) {
  var depth = node.depth + (this.increaseDepth ? 1 : 0)
  var name = depth === 2 ? 'SH' : 'SS'
  var value

  if (node === this.mainHeading) {
    return
  }

  value = this.all(node).join('')

  // Convert top-level section names to ALL-CAPS.
  if (name === 'SH') {
    value = value.toUpperCase()
  }

  return macro(name, quote(value))
}

function link(node, href) {
  var value = 'children' in node ? this.all(node).join('') : node.alt
  var url = escape(typeof href === 'string' ? href : node.url || '')
  var head

  if (url && url.slice(0, mailto.length) === mailto) {
    url = url.slice(mailto.length)
  }

  head = url.charAt(0) === '#' && this.headings[url.slice(1)]

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
    value = bold.call(this, value)

    if (url) {
      value += ' '
    }
  }

  return value + (url ? italic.call(this, url) : '')
}

function reference(node) {
  var definition = this.definitions(node.identifier)
  /* istanbul ignore next - plugins could inject reference w/o definitions. */
  var url = definition ? definition.url : null
  return link.call(this, node, url)
}

function code(node) {
  return ['.P', '.RS 2', '.nf', escape(node.value), '.fi', '.RE'].join('\n')
}

function blockquote(node) {
  var value

  this.level++

  value = this.all(node).join('\n')

  this.level--

  value = '.RS ' + (this.level ? 4 : 0) + '\n' + value + '\n.RE 0\n'

  return value
}

function text(node) {
  return escape(node.value.replace(/[\n ]+/g, ' '))
}

function list(node) {
  var start = node.start
  var children = node.children
  var length = children.length
  var index = -1
  var values = []
  var bullet

  this.level++

  while (++index < length) {
    bullet = start ? start + index + '.' : '\\(bu'
    values.push(listItem.call(this, children[index], bullet, index))
  }

  this.level--

  return ['.RS ' + (this.level ? 4 : 0), values.join('\n'), '.RE 0\n'].join(
    '\n'
  )
}

function listItem(node, bullet) {
  var result = this.all(node).join('\n').slice(p.length)

  return '.IP ' + bullet + ' 4\n' + result
}

function table(node) {
  var rows = node.children
  var index = rows.length
  var align = node.align
  var alignLength = align.length
  var pos
  var result = []
  var row
  var out
  var alignHeading = []
  var alignRow = []

  while (index--) {
    pos = -1
    row = rows[index].children
    out = []

    while (++pos < alignLength) {
      out[pos] = this.all(row[pos]).join('')
    }

    result[index] = out.join('@')
  }

  pos = -1

  while (++pos < alignLength) {
    alignHeading.push('cb')
    alignRow.push((align[pos] || 'l').charAt(0))
  }

  result = []
    .concat(
      ['', 'tab(@) allbox;', alignHeading.join(' '), alignRow.join(' ') + ' .'],
      result,
      ['.TE']
    )
    .join('\n')

  return macro('TS', result)
}

// Compile a `root` node.
// This compiles a man header, and the children of `root`.
function root(node) {
  return this.all(node).join('\n')
}

function noop() {}
