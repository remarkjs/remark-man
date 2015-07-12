'use strict';

/*
 * Dependencies.
 */

var visit = require('mdast-util-visit');
var toString = require('mdast-util-to-string');
var expression = require('./expression.js');
var uniglyph = require('./uniglyph.json');

/*
 * Compilers.
 */

var visitors = {};

/*
 * List of full English month names.
 */

var months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

/**
 * Stringify an argument which can be passed to `new Date`
 * into a full month name and a year.
 *
 * @example
 *   toDate(new Date()) // 'June 2015'
 *   toDate(Date.now()) // 'June 2015'
 *   toDate('2015-4-4') // 'April 2015'
 *
 * @param {Date|number|string} date
 * @return {string}
 */
function toDate(date) {
    date = new Date(date);

    return months[date.getMonth()] + ' ' + date.getFullYear();
}

/**
 * Escape a value for roff output.
 *
 * @example
 *   escape('#') // '\\[sh]'
 *
 * @param {string} value
 * @return {string}
 */
function escape(value) {
    return value.replace(expression, function (characters) {
        return '\\[' + uniglyph[characters] + ']';
    });
}

/**
 * Compile a roff macro.
 *
 * @example
 *   macro('P') // '.P'
 *   macro('P', '...') // '.P\n...'
 *
 * @param {string} name
 * @param {string?} [value]
 * @return {string}
 */
function macro(name, value) {
    return '.' + name + (value ?
        (value.charAt(0) === '\n' ? value : ' ' + value) : '');
}

/**
 * Wrap `value` with double quotes, and escape internal
 * double quotes.
 *
 * @example
 *   quote('foo "bar" baz') // '"foo \\"bar\\" baz"'
 *
 * @param {string} value
 * @return {string}
 */
function quote(value) {
    return '"' + String(value).replace(/"/g, '\\"') + '"';
}

/**
 * Wrap a value in a text decoration.
 *
 * @example
 *   textDecoration('B', '...') // '\fB...\fR'
 *
 * @param {string} name
 * @param {string?} [value]
 * @return {string}
 */
function textDecoration(name, value) {
    return '\\f' + name + (value ? value : '') + '\\fR';
}

/**
 * Wrap a node in an inline roff command.
 *
 * @example
 *   inline('B', '...') // '\fB...\fR'
 *   inline('B', strongNode, compiler) // '\fB...\fR'
 *
 * @param {string} decoration
 * @param {Node|string} node
 * @param {ManCompiler} compiler
 * @return {string}
 */
function inline(decoration, node, compiler) {
    var value = typeof node === 'string' ?
        node : compiler.all(node).join('');

    return textDecoration(decoration, value);
}

/**
 * Compile a value as bold.
 *
 * @example
 *   bold(node) // '\fB...\fR'
 *
 * @param {Node} node - Strong node.
 * @return {string}
 */
function bold(node) {
    return inline('B', node, this);
}

/**
 * Compile a value as italic.
 *
 * @example
 *   italic(node) // '\fI...\fR'
 *
 * @param {Node} node - Emphasis node.
 * @return {string}
 */
function italic(node) {
    return inline('I', node, this);
}

/**
 * Compile inline code.
 *
 * @example
 *   inlineCode(node) // '\fI...\fR'
 *
 * @param {Node} node - Inline code node.
 * @return {string}
 */
function inlineCode(node) {
    return inline('B', escape(node.value), this);
}

/**
 * Compile a break.
 *
 * @example
 *   hardBreak(node) // '\n.br\n'
 *
 * @return {string}
 */
function hardBreak() {
    return '\n' + macro('br') + '\n';
}

/**
 * Compile a horizontal rule.
 *
 * @example
 *   rule(node) // '\n\\(em\\(em\\(em'
 *
 * @return {string}
 */
function rule() {
    return '\n\\(em\\(em\\(em';
}

/**
 * Compile a paragraph.
 *
 * @example
 *   paragraph(node) // '.P \nFoo bar...'
 *
 * @param {Node} node - Paragraph node.
 * @return {string}
 */
function paragraph(node) {
    return macro('P', '\n' + this.all(node).join(''));
}

/**
 * Compile a heading.
 *
 * @example
 *   heading(node) // '.SH "DESC...'
 *
 * @param {Node} node - Heading node.
 * @return {string}
 */
function heading(node) {
    var name = node.depth === 2 ? 'SH' : 'SS';

    return macro(name, quote(this.all(node).join('')));
}

var MAILTO = 'mailto:';

/**
 * Compile a link.
 *
 * @example
 *   link(node) // 'normal link \fIhttp://...'
 *
 * @param {Node} node - Link or image node.
 * @param {string?} href - Overwrite URL.
 * @return {string}
 */
function link(node, href) {
    var self = this;
    var url = typeof href === 'string' ? href : node.href || node.src;
    var value = 'children' in node ? self.all(node).join('') : node.alt;
    var head;

    url = url ? self.encode(url) : '';

    if (url && url.slice(0, MAILTO.length) === MAILTO) {
        url = url.slice(MAILTO.length);
    }

    if (url.charAt(0) === '#') {
        head = self.headings[url.slice(1)];

        if (head) {
            url = '(' + toString(head) + ')';
        }
    }

    value = value && escape(url) === value ? '' : value;

    if (value && url) {
        value += ' ';
    }

    return value + (url ? italic(url) : '');
}

/**
 * Compile a reference.
 *
 * @example
 *   reference(node) // 'normal link \fIhttp://...'
 *
 * @param {Node} node - Reference node.
 * @return {string}
 */
function reference(node) {
    return this.link(node, this.links[node.identifier.toUpperCase()]);
}

/**
 * Compile code.
 *
 * @example
 *   code(node) // '.RS 2\n .nf'
 *
 * @param {Node} node - Code node.
 * @return {string}
 */
function code(node) {
    return '.P\n' +
        '.RS 2\n' +
        '.nf\n' +
        escape(node.value) + '\n' +
        '.fi\n' +
        '.RE';
}

/**
 * Compile a block quote.
 *
 * @example
 *   blockquote(node) // '.RS 0 ...'
 *
 * @param {Node} node - Block quote node.
 * @return {string}
 */
function blockquote(node) {
    var self = this;
    var value;

    self.level++;

    value = self.block(node);

    self.level--;

    value = '.RS ' + (self.level ? 4 : 0) + '\n' + value + '\n.RE 0\n';

    return value;
}

/**
 * Compile text.
 *
 * @example
 *   list(node) // 'foo \[em] bar'
 *
 * @param {Node} node - Text node.
 * @return {string}
 */
function text(node) {
    return escape(node.value.replace(/[\n ]+/g, ' '));
}

/**
 * Compile a list.
 *
 * @example
 *   list(node) // '.RS 4 ...'
 *
 * @param {Node} node - List node.
 * @return {string}
 */
function list(node) {
    var self = this;
    var start = node.start;
    var children = node.children;
    var length = children.length;
    var index = -1;
    var values = [];
    var bullet;

    self.level++;

    while (++index < length) {
        bullet = start ? start + index + '.' : '\\(bu';

        values.push(self.listItem(children[index], bullet, index));
    }

    self.level--;

    return '.RS ' + (this.level ? 4 : 0) + '\n' +
        values.join('\n') + '\n' +
        '.RE 0\n';
}

var PARAGRAPH = macro('P', '\n');

/**
 * Compile a list-item.
 *
 * @example
 *   listItem(node, '\\(bu') // '.IP \(bu 4 ...'
 *
 * @param {Node} node - List-item node.
 * @param {string} bullet - Bullet to use.
 * @return {string}
 */
function listItem(node, bullet) {
    var result = this.all(node).join('\n').slice(PARAGRAPH.length);

    return '.IP ' + bullet + ' 4\n' + result;
}

/**
 * Compile the children of `node` (such as root,
 * blockquote) as blocks.
 *
 * @example
 *   block(node) // '.P ...'
 *
 * @param {Node} node - Block node, such as a root.
 * @return {string}
 */
function block(node) {
    var self = this;
    var nodes = node.children;
    var values = [];
    var index = -1;
    var length = nodes.length;
    var value;

    while (++index < length) {
        value = self.visit(nodes[index], node);

        if (value) {
            values.push(value);
        }
    }

    return values.join('\n');
}

/**
 * Compile a `root` node.  This compiles a man header,
 * and the children of `root`.
 *
 * @example
 *   root(node) // '.TH "foo...'
 *
 * @param {Node} node - Root node.
 * @return {string}
 */
function root(node) {
    var self = this;
    var file = self.file;
    var config = file.manConfiguration;
    var defaults = self.defaultManConfiguration;
    var name = config.name || defaults.name || '';
    var section = config.section || defaults.section || '';
    var description = config.description || defaults.description || config.title || '';
    var links = {};
    var headings = {};
    var value;
    var extension;

    self.links = links;
    self.headings = headings;

    visit(node, 'definition', function (definition) {
        links[definition.identifier.toUpperCase()] = definition.link;
    });

    visit(node, 'heading', function (definition) {
        headings[definition.attributes.id] = definition;
    });

    /*
     * Initial indentation level.
     */

    self.level = 0;

    /*
     * Set the file extension.
     */

    if (section !== '') {
        extension = String(section);
        file.extension = extension;

        extension = '.' + extension;

        if (
            file.filename &&
            file.filename.slice(-extension.length) === extension
        ) {
            file.filename = file.filename.slice(0, -extension.length);
        }
    }

    value = self.block(node);

    /*
     * Ensure a final eof eol is added.
     */

    if (value && value.charAt(value.length - 1) !== '\n') {
        value += '\n';
    }

    return macro('TH',
        quote(escape(name.toUpperCase())) +
        ' ' +
        quote(section) +
        ' ' +
        quote(toDate(defaults.date || new Date())) +
        ' ' +
        quote(defaults.version || '') +
        ' ' +
        quote(defaults.manual || '')
    ) + '\n' +
    (name ? macro('SH', quote('NAME')) + '\n' + bold(name) : '') +
    escape(name && description ? ' - ' + description : description) + '\n' +
    value;
}

/**
 * Return an empty string and emit a warning.
 *
 * @example
 *   invalid(htmlNode) // Warns that HTML cannot be compiled.
 *
 * @param {Node} node - Node to warn about.
 * @return {string} - Empty string.
 */
function invalid(node) {
    this.file.warn('Cannot compile node of type `' + node.type + '`', node);

    return '';
}

/**
 * Return an empty string for nodes which are ignored.
 *
 * @return {string}
 */
function ignore() {
    return '';
}

visitors.inlineCode = inlineCode;
visitors.strong = bold;
visitors.emphasis = italic;
visitors.delete = italic;
visitors.break = hardBreak;
visitors.link = link;
visitors.image = link;
visitors.heading = heading;
visitors.block = block;
visitors.root = root;
visitors.paragraph = paragraph;
visitors.horizontalRule = rule;
visitors.blockquote = blockquote;
visitors.code = code;
visitors.list = list;
visitors.listItem = listItem;
visitors.text = text;
visitors.escape = text;
visitors.linkReference = reference;
visitors.imageReference = reference;
visitors.definition = ignore;

visitors.yaml = invalid;
visitors.html = invalid;
visitors.footnoteReference = invalid;
visitors.footnote = invalid;
visitors.footnoteDefinition = invalid;
visitors.table = invalid;
visitors.tableCell = invalid;

/*
 * Expose.
 */

module.exports = visitors;
