'use strict';

/*
 * Dependencies.
 */

var visit = require('./visit.js');
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
 * @param {string} name
 * @param {string?} [value]
 * @return {string}
 */
function macro(name, value) {
    return '.' + name + (value ? ' ' + value : '');
}

/**
 * Wrap `value` with double quotes, and escape internal
 * double quotes.
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
 * @param {Node} node
 * @return {string}
 */
function bold(node) {
    return inline('B', node, this);
}

/**
 * Compile a value as italic.
 *
 * @param {Node} node
 * @return {string}
 */
function italic(node) {
    return inline('I', node, this);
}

/**
 * Gather link definitions.
 *
 * @param {Node} node
 */
function gatherDefinitions(node) {
    this.links[node.identifier] = node.link;
}

/**
 * Compile inline code.
 *
 * @param {Node} node
 * @return {string}
 */
function inlineCode(node) {
    return inline('B', escape(node.value), this);
}

/**
 * Compile a break.
 *
 * @return {string}
 */
function hardBreak() {
    return '\n' + macro('br') + '\n';
}

/**
 * Compile a horizontal rule.
 *
 * @return {string}
 */
function rule() {
    return '\n\\(em\\(em\\(em';
}

/**
 * Compile a paragraph.
 *
 * @param {Node} node
 * @return {string}
 */
function paragraph(node) {
    return macro('P', '\n' + this.all(node).join(''));
}

/**
 * Compile a heading.
 *
 * @param {Node} node
 * @return {string}
 */
function heading(node) {
    var name;

    if (node.depth === 1) {
        return '';
    }

    name = node.depth === 2 ? 'SH' : 'SS';

    return macro(name, quote(this.all(node).join('')));
}

var MAILTO = 'mailto:';

/**
 * Compile a link.
 *
 * @param {Node} node
 * @return {string}
 */
function link(node, href) {
    var self = this;
    var url = typeof href === 'string' ? href : node.href || node.src;
    var value = 'children' in node ? self.all(node).join('') : node.alt;

    url = url ? self.encode(url) : '';

    if (url && url.slice(0, MAILTO.length) === MAILTO) {
        url = url.slice(MAILTO.length);
    }

    value = value && escape(url) === value ? '' : value;

    if (value && url) {
        value += ' ';
    }

    return value + (url ? italic(url) : '');
}

/**
 * Output a reference.
 *
 * @param {Node} node
 * @return {string}
 */
function reference(node) {
    return this.link(node, this.links[node.identifier]);
}

/**
 * Compile code.
 *
 * @param {Node} node
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
 * @param {Node} node
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
 * @param {Node} node
 * @return {string}
 */
function text(node) {
    return escape(node.value.replace(/[\n ]+/g, ' '));
}

/**
 * Compile a list.
 *
 * @param {Node} node
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

var PARAGRAPH = macro('P') + ' \n';

/**
 * Compile a list-item.
 *
 * @param {Node} node
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
 * @param {Node} node
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
 * @param {Node} node
 * @return {string}
 */
function root(node) {
    var self = this;
    var file = self.file;
    var config = file.manConfiguration;
    var defaults = self.defaultManConfiguration;
    var name = config.name || defaults.name || '';
    var section = config.section || defaults.section || '';
    var description = config.description || defaults.section || '';
    var value;

    self.links = {};

    visit(node, 'definition', gatherDefinitions, self);

    /*
     * Initial indentation level.
     */

    self.level = 0;

    /*
     * Set the file extension.
     */

    if (section !== '') {
        file.extension = String(section);
    }

    value = self.block(node);

    /*
     * Ensure a final eof eol is added.
     */

    if (value.charAt(value.length - 1) !== '\n') {
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
 * @return {string}
 */
function invalid(node) {
    this.file.warn('Cannot compile node of type `' + node.type + '`', node);

    return '';
}

/**
 * Return an empty string.
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
