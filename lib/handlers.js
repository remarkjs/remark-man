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

const p = macro('P', '\n')

// Wrap a value in a text decoration.
function textDecoration(enter, value, exit) {
  // Previously, remark sometimes gave empty nodes.
  /* c8 ignore next */
  const clean = String(value || '')
  return '\\f' + enter + clean + '\\f' + exit
}

// Wrap a node in an inline roff command.
function inline(decoration, node, compiler) {
  const exit = compiler.exitMarker || 'R'
  let value = node

  compiler.exitMarker = decoration

  if (node && typeof node === 'object' && 'type' in node) {
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
  const depth = node.depth + (this.increaseDepth ? 1 : 0)
  const name = depth === 2 ? 'SH' : 'SS'

  if (node === this.mainHeading) {
    return
  }

  let value = this.all(node).join('')

  // Convert top-level section names to ALL-CAPS.
  if (name === 'SH') {
    value = value.toUpperCase()
  }

  return macro(name, quote(value))
}

function link(node, href) {
  let value = 'children' in node ? this.all(node).join('') : node.alt
  let url = escape(typeof href === 'string' ? href : node.url || '')

  if (url && url.slice(0, 'mailto:'.length) === 'mailto:') {
    url = url.slice('mailto:'.length)
  }

  const head = url.charAt(0) === '#' && this.headings[url.slice(1)]

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
  const definition = this.definitions(node.identifier)
  // Plugins could inject reference w/o definitions.
  /* c8 ignore next */
  const url = definition ? definition.url : null
  return link.call(this, node, url)
}

function code(node) {
  return ['.P', '.RS 2', '.nf', escape(node.value), '.fi', '.RE'].join('\n')
}

function blockquote(node) {
  this.level++
  const value = this.all(node).join('\n')
  this.level--

  return ['.RS ' + (this.level ? 4 : 0), value, '.RE 0', ''].join('\n')
}

function text(node) {
  return escape(node.value.replace(/[\n ]+/g, ' '))
}

function list(node) {
  const start = node.start
  const values = []
  let index = -1

  this.level++

  while (++index < node.children.length) {
    const bullet = start ? start + index + '.' : '\\(bu'
    values.push(listItem.call(this, node.children[index], bullet, index))
  }

  this.level--

  return ['.RS ' + (this.level ? 4 : 0), ...values, '.RE 0', ''].join('\n')
}

function listItem(node, bullet) {
  return '.IP ' + bullet + ' 4\n' + this.all(node).join('\n').slice(p.length)
}

function table(node) {
  const result = []
  let index = -1

  while (++index < node.children.length) {
    const cells = node.children[index].children
    const out = []
    let cellIndex = -1

    while (++cellIndex < node.align.length) {
      out.push(this.all(cells[cellIndex]).join(''))
    }

    result[index] = out.join('@')
  }

  const alignHeading = []
  const alignRow = []
  index = -1

  while (++index < node.align.length) {
    alignHeading.push('cb')
    alignRow.push((node.align[index] || 'l').charAt(0))
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

// Compile a `root` node.
// This compiles a man header, and the children of `root`.
function root(node) {
  return this.all(node).join('\n')
}

function noop() {}
