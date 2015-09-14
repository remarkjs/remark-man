(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.mdastMan = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module mdast:man
 * @fileoverview Compile Markdown to man pages (roff) with mdast.
 */

'use strict';

/*
 * Dependencies.
 */

var slug = require('mdast-slug');
var transformer = require('./lib/transformer.js');
var compilers = require('./lib/compilers.js');

/**
 * Attach a roff compiler, and a man-header detection
 * method as a transformer.
 *
 * @param {MDAST} mdast - Processor.
 * @param {Object?} [options] - Configuration.
 * @return {Function} - See `transformer`.
 */
function attacher(mdast, options) {
    var settings = options || {};
    var ancestor = mdast.Compiler.prototype;
    var key;

    mdast.use(slug, settings.slug);

    /*
     * Expose given settings.
     */

    ancestor.defaultManConfiguration = settings;

    /*
     * Expose compiler.
     */

    for (key in compilers) {
        ancestor[key] = compilers[key];
    }

    return transformer;
}

/*
 * Expose `plugin`.
 */

module.exports = attacher;

},{"./lib/compilers.js":2,"./lib/transformer.js":4,"mdast-slug":6}],2:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module mdast:man:compilers
 * @fileoverview Compilers to transform mdast nodes to roff.
 */

'use strict';

/*
 * Dependencies.
 */

var visit = require('unist-util-visit');
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
 * @param {Date|number|string} date - Date to transform.
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
 * @param {string} value - Value to escape.
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
 * @param {string} name - Name of macro.
 * @param {string?} [value] - Content of macro.
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
 * @param {string} value - Content.
 * @return {string}
 */
function quote(value) {
    return '"' + String(value).replace(/"/g, '\\"') + '"';
}

/**
 * Wrap a value in a text decoration.
 *
 * @example
 *   textDecoration('B', '...', 'R') // '\fB...\fR'
 *
 * @param {string} enter - Opening font-setting.
 * @param {string?} [value] - Content.
 * @param {string} exit - Closing font-setting.
 * @return {string}
 */
function textDecoration(enter, value, exit) {
    return '\\f' + enter + (value ? value : '') + '\\f' + exit;
}

/**
 * Wrap a node in an inline roff command.
 *
 * @example
 *   inline('B', '...') // '\fB...\fR'
 *   inline('B', strongNode, compiler) // '\fB...\fR'
 *
 * @param {string} decoration - Command.
 * @param {Node|string} node - mdast node.
 * @param {ManCompiler} compiler - Context.
 * @return {string}
 */
function inline(decoration, node, compiler) {
    var exit = compiler.exitMarker || 'R';
    var value = node;

    compiler.exitMarker = decoration;

    if (node && node.type) {
        value = compiler.all(node).join('');
    }

    compiler.exitMarker = exit;

    return textDecoration(decoration, value, exit);
}

/**
 * Compile a value as bold.
 *
 * @example
 *   bold(node) // '\fB...\fR'
 *
 * @this {ManCompiler}
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
 * @this {ManCompiler}
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
 * @this {ManCompiler}
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
    var value = this.all(node).join('');

    // Convert top-level section names to ALL-CAPS.
    if (name === 'SH') {
        value = value.toUpperCase();
    }

    return macro(name, quote(value));
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

    head = url.charAt(0) === '#' && self.headings[url.slice(1)];

    if (head) {
        url = '(' + escape(toString(head)) + ')';
    } else {
        if (value && escape(url) === value) {
            value = '';
        }

        if (url) {
            url = '\\(la' + escape(url) + '\\(ra';
        }
    }

    if (value) {
        value = self.strong(value);

        if (url) {
            value += ' ';
        }
    }

    return value + (url ? self.emphasis(url) : '');
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
 * Compile a table.
 *
 * @example
 *   table(node) // '.TS\ntab(@) allbox\n ...'
 *
 * @param {Node} node - Table node.
 * @return {string}
 */
function table(node) {
    var self = this;
    var rows = node.children;
    var index = rows.length;
    var align = node.align;
    var alignLength = align.length;
    var pos;
    var result = [];
    var row;
    var out;
    var alignHeading = [];
    var alignRow = [];

    while (index--) {
        pos = -1;
        row = rows[index].children;
        out = [];

        while (++pos < alignLength) {
            out[pos] = self.all(row[pos]).join('');
        }

        result[index] = out.join('@');
    }

    pos = -1;

    while (++pos < alignLength) {
        alignHeading.push('cb');
        alignRow.push((align[pos] || 'l').charAt(0));
    }

    result = [].concat([
        '',
        'tab(@) allbox;',
        alignHeading.join(' '),
        alignRow.join(' ') + ' .'
    ], result, [
        '.TE'
    ]).join('\n');

    return macro('TS', result);
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
    var description = config.description || defaults.description ||
        config.title || '';
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
        var data = definition.data;
        var id;

        /* istanbul ignore else - legacy mdast-slug */
        if ('id' in data) {
            id = data.id;
        } else {
            id = definition.attributes.id;
        }

        headings[id] = definition;
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
    (name ? macro('SH', quote('NAME')) + '\n' + self.strong(name) : '') +
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
visitors.table = table;

visitors.yaml = invalid;
visitors.html = invalid;
visitors.footnoteReference = invalid;
visitors.footnote = invalid;
visitors.footnoteDefinition = invalid;

/*
 * Expose.
 */

module.exports = visitors;

},{"./expression.js":3,"./uniglyph.json":5,"mdast-util-to-string":9,"unist-util-visit":10}],3:[function(require,module,exports){
/* This file is generated by `script/build-unigroff.js` */
'use strict';

module.exports = /ffi|ffl|Ü|ö|Ÿ|∉|Ž|≠|ý|À|ü|Â|û|Ä|ú|Ć|ù|È|š|Ê|à|Ì|á|Î|â|Ñ|ã|Ó|ä|Õ|å|Š|ć|Ú|ç|⊅|è|ž|é|Á|ê|Å|ë|É|≢|Í|⊄|Ò|ì|Ö|í|Û|î|ÿ|ï|Ç|ñ|Ï|õ|ô|ó|ò|Ô|Ë|Ã|Ý|Ù|Τ|⟩|‐|"|–|`|—|\^|‘|\\|’|@|‚|\{|“|\}|”|¡|„|£|†|¥|‡|§|•|©|‰|«|′|®|″|°|‹|²|›|´|‾|¶|⁄|¸|€|º|ℏ|¼|ℑ|¾|℘|Æ|ℜ|×|™|Þ|ℵ|æ|⅛|÷|⅜|þ|⅝|Ĳ|⅞|Ł|←|Œ|↑|ƒ|→|ˇ|↓|˙|↔|˛|↕|Β|↵|Δ|⇐|Ζ|⇑|Θ|⇒|Κ|⇓|Μ|⇔|Ξ|⇕|Π|∀|Σ|∂|Υ|∃|Χ|∅|Ω|∇|β|∈|δ|\/|ζ|∋|θ|∏|κ|∐|μ|∑|ξ|−|π|∓|ς|∗|τ|√|φ|∝|ψ|∞|ϑ|∠|ϖ|∧|_|∨|\[|∩|\||∪|¢|∫|¦|∴|ª|∼|¯|≃|³|≅|·|≈|»|≡|¿|\+|Ø|≤|ð|≥|ı|≪|ł|≫|ȷ|⊂|˚|'|Γ|⊃|Η|\$|Λ|⊆|Ο|⊇|#|⊕|Ψ|⊗|γ|⊥|η|⋅|λ|⌈|ο|⌉|σ|⌊|χ|⌋|ϕ|⎛|\]|⎜|~|⎝|¨|⎞|±|⎟|¹|⎠|Ð|⎢|ø|⎥|œ|⎧|Α|⎨|Ι|⎩|Ρ|⎪|α|⎫|ι|⎬|ρ|⎭|ω|⎯|=|│|¬|□|½|◊|ĳ|○|Ε|☜|Φ|☞|ν|♠|ϵ|♣|µ|˘|⟨|✓|♦|♥|Ν|ß|¤|υ|ε/g;

},{}],4:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module mdast:man:transformer
 * @fileoverview Transform the syntax-tree of a processed document.
 */

'use strict';

var visit = require('unist-util-visit');
var toString = require('mdast-util-to-string');

var MAN_EXPRESSION =
    /([\w_.\[\]~+=@:-]+)(?:\s*)(?:\((\d\w*)\))(?:\s*(?:[-—–])+\s*(.*))?/;

/**
 * Transform a file.  This just parses the heading and
 * adds it’s name, section, and description to the file.
 *
 * @param {Object} ast - Root node.
 * @param {File} file - Virtual file.
 */
function transformer(ast, file) {
    var man = {};
    var titleCount = 0;
    var titleIndex;
    var title;
    var value;
    var match;

    /*
     * Expose per file overwrites on `file`.
     */

    file.manConfiguration = man;

    visit(ast, 'heading', function (node, index) {
        if (node.depth === 1) {
            if (!titleCount) {
                title = node;
                titleIndex = index;
            }

            titleCount++;
        }
    });

    if (titleCount > 1) {
        visit(ast, 'heading', function (node) {
            node.depth++;
        });
    }

    if (title) {
        ast.children.splice(titleIndex, 1);
        value = toString(title);
        match = MAN_EXPRESSION.exec(value);

        if (match) {
            man.name = match[1];
            man.section = match[2];
            man.description = match[3];
        } else {
            man.title = value;
        }
    } else if (file.filename) {
        value = file.filename.split('.');
        match = value[value.length - 1];

        if (match && match.length === 1) {
            man.section = value.pop();
            man.name = value.join('.');
        }
    }
}

/*
 * Expose.
 */

module.exports = transformer;

},{"mdast-util-to-string":9,"unist-util-visit":10}],5:[function(require,module,exports){
module.exports={
  "\"": "dq",
  "#": "sh",
  "$": "Do",
  "'": "aq",
  "+": "pl",
  "/": "sl",
  "=": "eq",
  "≠": "!=",
  "@": "at",
  "À": "`A",
  "Á": "'A",
  "Â": "^A",
  "Ã": "~A",
  "Ä": ":A",
  "Å": "oA",
  "Ć": "'C",
  "Ç": ",C",
  "È": "`E",
  "É": "'E",
  "Ê": "^E",
  "Ë": ":E",
  "Ì": "`I",
  "Í": "'I",
  "Î": "^I",
  "Ï": ":I",
  "Ñ": "~N",
  "Ò": "`O",
  "Ó": "'O",
  "Ô": "^O",
  "Õ": "~O",
  "Ö": ":O",
  "Š": "vS",
  "Ù": "`U",
  "Ú": "'U",
  "Û": "^U",
  "Ü": ":U",
  "Ý": "'Y",
  "Ÿ": ":Y",
  "Ž": "vZ",
  "[": "lB",
  "\\": "rs",
  "]": "rB",
  "^": "ha",
  "_": "ul",
  "`": "ga",
  "à": "`a",
  "á": "'a",
  "â": "^a",
  "ã": "~a",
  "ä": ":a",
  "å": "oa",
  "ć": "'c",
  "ç": ",c",
  "è": "`e",
  "é": "'e",
  "ê": "^e",
  "ë": ":e",
  "ffi": "Fi",
  "ffl": "Fl",
  "ì": "`i",
  "í": "'i",
  "î": "^i",
  "ï": ":i",
  "ñ": "~n",
  "ò": "`o",
  "ó": "'o",
  "ô": "^o",
  "õ": "~o",
  "ö": ":o",
  "š": "vs",
  "ù": "`u",
  "ú": "'u",
  "û": "^u",
  "ü": ":u",
  "ý": "'y",
  "ÿ": ":y",
  "ž": "vz",
  "{": "lC",
  "|": "ba",
  "}": "rC",
  "~": "ti",
  "¡": "r!",
  "¢": "ct",
  "£": "Po",
  "¤": "Cs",
  "¥": "Ye",
  "¦": "bb",
  "§": "sc",
  "¨": "ad",
  "©": "co",
  "ª": "Of",
  "«": "Fo",
  "¬": "no",
  "®": "rg",
  "¯": "a-",
  "°": "de",
  "±": "+-",
  "²": "S2",
  "³": "S3",
  "´": "aa",
  "µ": "mc",
  "¶": "ps",
  "·": "pc",
  "¸": "ac",
  "¹": "S1",
  "º": "Om",
  "»": "Fc",
  "¼": "14",
  "½": "12",
  "¾": "34",
  "¿": "r?",
  "Æ": "AE",
  "Ð": "-D",
  "×": "mu",
  "Ø": "/O",
  "Þ": "TP",
  "ß": "ss",
  "æ": "ae",
  "ð": "Sd",
  "÷": "di",
  "ø": "/o",
  "þ": "Tp",
  "ı": ".i",
  "Ĳ": "IJ",
  "ĳ": "ij",
  "Ł": "/L",
  "ł": "/l",
  "Œ": "OE",
  "œ": "oe",
  "ƒ": "Fn",
  "ȷ": ".j",
  "ˇ": "ah",
  "˘": "ab",
  "˙": "a.",
  "˚": "ao",
  "˛": "ho",
  "Α": "*A",
  "Β": "*B",
  "Γ": "*G",
  "Δ": "*D",
  "Ε": "*E",
  "Ζ": "*Z",
  "Η": "*Y",
  "Θ": "*H",
  "Ι": "*I",
  "Κ": "*K",
  "Λ": "*L",
  "Μ": "*M",
  "Ν": "*N",
  "Ξ": "*C",
  "Ο": "*O",
  "Π": "*P",
  "Ρ": "*R",
  "Σ": "*S",
  "Τ": "*T",
  "Υ": "*U",
  "Φ": "*F",
  "Χ": "*X",
  "Ψ": "*Q",
  "Ω": "*W",
  "α": "*a",
  "β": "*b",
  "γ": "*g",
  "δ": "*d",
  "ε": "*e",
  "ζ": "*z",
  "η": "*y",
  "θ": "*h",
  "ι": "*i",
  "κ": "*k",
  "λ": "*l",
  "μ": "*m",
  "ν": "*n",
  "ξ": "*c",
  "ο": "*o",
  "π": "*p",
  "ρ": "*r",
  "ς": "ts",
  "σ": "*s",
  "τ": "*t",
  "υ": "*u",
  "φ": "+f",
  "χ": "*x",
  "ψ": "*q",
  "ω": "*w",
  "ϑ": "+h",
  "ϕ": "*f",
  "ϖ": "+p",
  "ϵ": "+e",
  "‐": "hy",
  "–": "en",
  "—": "em",
  "‘": "oq",
  "’": "cq",
  "‚": "bq",
  "“": "lq",
  "”": "rq",
  "„": "Bq",
  "†": "dg",
  "‡": "dd",
  "•": "bu",
  "‰": "%0",
  "′": "fm",
  "″": "sd",
  "‹": "fo",
  "›": "fc",
  "‾": "rn",
  "⁄": "f/",
  "€": "Eu",
  "ℏ": "-h",
  "ℑ": "Im",
  "℘": "wp",
  "ℜ": "Re",
  "™": "tm",
  "ℵ": "Ah",
  "⅛": "18",
  "⅜": "38",
  "⅝": "58",
  "⅞": "78",
  "←": "<-",
  "↑": "ua",
  "→": "->",
  "↓": "da",
  "↔": "<>",
  "↕": "va",
  "↵": "CR",
  "⇐": "lA",
  "⇑": "uA",
  "⇒": "rA",
  "⇓": "dA",
  "⇔": "hA",
  "⇕": "vA",
  "∀": "fa",
  "∂": "pd",
  "∃": "te",
  "∅": "es",
  "∇": "gr",
  "∈": "mo",
  "∉": "nm",
  "∋": "st",
  "∏": "product",
  "∐": "coproduct",
  "∑": "sum",
  "−": "mi",
  "∓": "-+",
  "∗": "**",
  "√": "sr",
  "∝": "pt",
  "∞": "if",
  "∠": "/_",
  "∧": "AN",
  "∨": "OR",
  "∩": "ca",
  "∪": "cu",
  "∫": "is",
  "∴": "tf",
  "∼": "ap",
  "≃": "|=",
  "≅": "=~",
  "≈": "~~",
  "≡": "==",
  "≢": "ne",
  "≤": "<=",
  "≥": ">=",
  "≪": ">>",
  "≫": "<<",
  "⊂": "sb",
  "⊄": "nb",
  "⊃": "sp",
  "⊅": "nc",
  "⊆": "ib",
  "⊇": "ip",
  "⊕": "c+",
  "⊗": "c*",
  "⊥": "pp",
  "⋅": "md",
  "⌈": "lc",
  "⌉": "rc",
  "⌊": "lf",
  "⌋": "rf",
  "⎛": "parenlefttp",
  "⎜": "parenleftex",
  "⎝": "parenleftbt",
  "⎞": "parenrighttp",
  "⎟": "parenrightex",
  "⎠": "parenrightbt",
  "⎢": "bracketleftex",
  "⎥": "bracketrightex",
  "⎧": "lt",
  "⎨": "lk",
  "⎩": "lb",
  "⎪": "bv",
  "⎫": "rt",
  "⎬": "rk",
  "⎭": "rb",
  "⎯": "an",
  "│": "br",
  "□": "sq",
  "◊": "lz",
  "○": "ci",
  "☜": "lh",
  "☞": "rh",
  "♠": "SP",
  "♣": "CL",
  "♥": "HE",
  "♦": "DI",
  "✓": "OK",
  "⟨": "la",
  "⟩": "ra"
}

},{}],6:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module mdast:slug
 * @fileoverview Add anchors to mdast heading nodes.
 */

'use strict';

/*
 * Dependencies.
 */

var toString = require('mdast-util-to-string');
var visit = require('unist-util-visit');
var repeat = require('repeat-string');

var slugg = null;
var fs = {};
var path = {};
var proc = {};

try {
    slugg = require('slugg');
} catch (exception) {/* empty */}

try {
    fs = require('fs');
} catch (exception) {/* empty */}

try {
    path = require('path');
} catch (exception) {/* empty */}

/*
 * Hide process use from browserify and component.
 */

/* istanbul ignore else */
if (typeof global !== 'undefined' && global.process) {
    proc = global.process;
}

/*
 * Methods.
 */

var exists = fs.existsSync;
var resolve = path.resolve;

/*
 * Constants.
 */

var MODULES = 'node_modules';
var EXTENSION = '.js';
var NPM = 'npm';
var GITHUB = 'github';
var SLUGG = 'slugg';
var DASH = '-';

var DEFAULT_LIBRARY = GITHUB;

/**
 * Find a library.
 *
 * @param {string} pathlike - File-path-like to load.
 * @return {Object}
 */
function loadLibrary(pathlike) {
    var cwd;
    var local;
    var npm;
    var plugin;

    if (pathlike === SLUGG && slugg) {
        return slugg;
    }

    cwd = proc.cwd && proc.cwd();

    /* istanbul ignore if */
    if (!cwd) {
        throw new Error('Cannot lazy load library when not in node');
    }

    local = resolve(cwd, pathlike);
    npm = resolve(cwd, MODULES, pathlike);

    if (exists(local) || exists(local + EXTENSION)) {
        plugin = local;
    } else if (exists(npm)) {
        plugin = npm;
    } else {
        plugin = pathlike;
    }

    return require(plugin);
}

/**
 * Wraps `slugg` to generate slugs just like npm would.
 *
 * @see https://github.com/npm/marky-markdown/blob/9761c95/lib/headings.js#L17
 *
 * @param {function(string): string} library - Value to
 *   slugify.
 * @return {function(string): string}
 */
function npmFactory(library) {
    /**
     * Generate slugs just like npm would.
     *
     * @param {string} value - Value to slugify.
     * @return {string}
     */
    function npm(value) {
        return library(value).replace(/[<>]/g, '').toLowerCase();
    }

    return npm;
}

/**
 * Wraps `slugg` to generate slugs just like GitHub would.
 *
 * @param {function(string): string} library - Library to
 *   use.
 * @return {function(string): string}
 */
function githubFactory(library) {
    /**
     * Hacky.  Sometimes `slugg` uses `replacement` as an
     * argument to `String#replace()`, and sometimes as
     * a literal string.
     *
     * @param {string} $0 - Value to transform.
     * @return {string}
     */
    function separator($0) {
        var match = $0.match(/\s/g);

        if ($0 === DASH) {
            return $0;
        }

        return repeat(DASH, match ? match.length : 0);
    }

    /**
     * @see seperator
     * @return {string}
     */
    function dash() {
        return DASH;
    }

    separator.toString = dash;

    /**
     * Generate slugs just like GitHub would.
     *
     * @param {string} value - Value to slugify.
     * @return {string}
     */
    function github(value) {
        return library(value, separator).toLowerCase();
    }

    return github;
}

/**
 * Attacher.
 *
 * @return {function(node)}
 */
function attacher(mdast, options) {
    var settings = options || {};
    var library = settings.library || DEFAULT_LIBRARY;
    var isNPM = library === NPM;
    var isGitHub = library === GITHUB;

    if (isNPM || isGitHub) {
        library = SLUGG;
    }

    if (typeof library === 'string') {
        library = loadLibrary(library);
    }

    if (isNPM) {
        library = npmFactory(library);
    } else if (isGitHub) {
        library = githubFactory(library);
    }

    /**
     * Patch `value` on `context` at `key`, if
     * `context[key]` does not already exist.
     */
    function patch(context, key, value) {
        if (!context[key]) {
            context[key] = value;
        }

        return context[key];
    }

    /**
     * Adds an example section based on a valid example
     * JavaScript document to a `Usage` section.
     *
     * @param {Node} ast - Root node.
     */
    function transformer(ast) {
        visit(ast, 'heading', function (node) {
            var id = library(toString(node));
            var data = patch(node, 'data', {});

            patch(data, 'id', id);
            patch(data, 'htmlAttributes', {});
            patch(data.htmlAttributes, 'id', id);
        });
    }

    return transformer;
}

/*
 * Expose.
 */

module.exports = attacher;

},{"fs":undefined,"mdast-util-to-string":9,"path":undefined,"repeat-string":7,"slugg":8,"unist-util-visit":10}],7:[function(require,module,exports){
/*!
 * repeat-string <https://github.com/jonschlinkert/repeat-string>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

/**
 * Expose `repeat`
 */

module.exports = repeat;

/**
 * Repeat the given `string` the specified `number`
 * of times.
 *
 * **Example:**
 *
 * ```js
 * var repeat = require('repeat-string');
 * repeat('A', 5);
 * //=> AAAAA
 * ```
 *
 * @param {String} `string` The string to repeat
 * @param {Number} `number` The number of times to repeat the string
 * @return {String} Repeated string
 * @api public
 */

function repeat(str, num) {
  if (typeof str !== 'string') {
    throw new TypeError('repeat-string expects a string.');
  }

  if (num === 1) return str;
  if (num === 2) return str + str;

  var max = str.length * num;
  if (cache !== str || typeof cache === 'undefined') {
    cache = str;
    res = '';
  }

  while (max > res.length && num > 0) {
    if (num & 1) {
      res += str;
    }

    num >>= 1;
    if (!num) break;
    str += str;
  }

  return res.substr(0, max);
}

/**
 * Results cache
 */

var res = '';
var cache;

},{}],8:[function(require,module,exports){
(function (root) {

var defaultSeparator = '-'

function slugg(string, separator, toStrip) {

  // Separator is optional
  if (typeof separator === 'undefined') separator = defaultSeparator

  // Separator might be omitted and toStrip in its place
  if (separator instanceof RegExp) {
    toStrip = separator
    separator = defaultSeparator
  }

  // Only a separator was passed
  if (typeof toStrip === 'undefined') toStrip = new RegExp('')

  // Swap out non-english characters for their english equivalent
  for (var i = 0, len = string.length; i < len; i++) {
    if (chars[string.charAt(i)]) {
      string = string.replace(string.charAt(i), chars[string.charAt(i)])
    }
  }

  string = string
    // Make lower-case
    .toLowerCase()
    // Strip chars that shouldn't be replaced with separator
    .replace(toStrip, '')
    // Replace non-word characters with separator
    .replace(/[\W|_]+/g, separator)
    // Strip dashes from the beginning
    .replace(new RegExp('^' + separator + '+'), '')
    // Strip dashes from the end
    .replace(new RegExp(separator + '+$'), '')

  return string

}

// Conversion table. Modified version of:
// https://github.com/dodo/node-slug/blob/master/src/slug.coffee
var chars = slugg.chars = {
  // Latin
  'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE',
  'Ç': 'C', 'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E', 'Ì': 'I', 'Í': 'I',
  'Î': 'I', 'Ï': 'I', 'Ð': 'D', 'Ñ': 'N', 'Ò': 'O', 'Ó': 'O', 'Ô': 'O',
  'Õ': 'O', 'Ö': 'O', 'Ő': 'O', 'Ø': 'O', 'Ù': 'U', 'Ú': 'U', 'Û': 'U',
  'Ü': 'U', 'Ű': 'U', 'Ý': 'Y', 'Þ': 'TH', 'ß': 'ss', 'à': 'a', 'á': 'a',
  'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae', 'ç': 'c', 'è': 'e',
  'é': 'e', 'ê': 'e', 'ë': 'e', 'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
  'ð': 'd', 'ñ': 'n', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
  'ő': 'o', 'ø': 'o', 'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'ű': 'u',
  'ý': 'y', 'þ': 'th', 'ÿ': 'y', 'ẞ': 'SS', 'œ': 'oe', 'Œ': 'OE',
  // Greek
  'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'h',
  'θ': '8', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': '3',
  'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's', 'τ': 't', 'υ': 'y', 'φ': 'f',
  'χ': 'x', 'ψ': 'ps', 'ω': 'w', 'ά': 'a', 'έ': 'e', 'ί': 'i', 'ό': 'o',
  'ύ': 'y', 'ή': 'h', 'ώ': 'w', 'ς': 's', 'ϊ': 'i', 'ΰ': 'y', 'ϋ': 'y',
  'ΐ': 'i', 'Α': 'A', 'Β': 'B', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z',
  'Η': 'H', 'Θ': '8', 'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M', 'Ν': 'N',
  'Ξ': '3', 'Ο': 'O', 'Π': 'P', 'Ρ': 'R', 'Σ': 'S', 'Τ': 'T', 'Υ': 'Y',
  'Φ': 'F', 'Χ': 'X', 'Ψ': 'PS', 'Ω': 'W', 'Ά': 'A', 'Έ': 'E', 'Ί': 'I',
  'Ό': 'O', 'Ύ': 'Y', 'Ή': 'H', 'Ώ': 'W', 'Ϊ': 'I', 'Ϋ': 'Y',
  // Turkish
  'ş': 's', 'Ş': 'S', 'ı': 'i', 'İ': 'I', 'ğ': 'g', 'Ğ': 'G',
  // Russian
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': 'u',
  'ы': 'y', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'А': 'A', 'Б': 'B',
  'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z',
  'И': 'I', 'Й': 'J', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
  'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H',
  'Ц': 'C', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sh', 'Ъ': 'U', 'Ы': 'Y',
  'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
  // Ukranian
  'Є': 'Ye', 'І': 'I', 'Ї': 'Yi', 'Ґ': 'G',
  'є': 'ye', 'і': 'i', 'ї': 'yi', 'ґ': 'g',
  // Czech
  'č': 'c', 'ď': 'd', 'ě': 'e', 'ň': 'n', 'ř': 'r', 'š': 's',
  'ť': 't', 'ů': 'u', 'ž': 'z', 'Č': 'C', 'Ď': 'D', 'Ě': 'E',
  'Ň': 'N', 'Ř': 'R', 'Š': 'S', 'Ť': 'T', 'Ů': 'U', 'Ž': 'Z',
  // Polish
  'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ś': 's',
  'ź': 'z', 'ż': 'z', 'Ą': 'A', 'Ć': 'C', 'Ę': 'e', 'Ł': 'L',
  'Ń': 'N', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z',
  // Latvian
  'ā': 'a', 'ē': 'e', 'ģ': 'g', 'ī': 'i', 'ķ': 'k', 'ļ': 'l',
  'ņ': 'n', 'ū': 'u', 'Ā': 'A', 'Ē': 'E', 'Ģ': 'G', 'Ī': 'i',
  'Ķ': 'k', 'Ļ': 'L', 'Ņ': 'N', 'Ū': 'u'
}

// Be compatible with different module systems

if (typeof define !== 'undefined' && define.amd) {
  // AMD
  define([], function () {
    return slugg
  })
} else if (typeof module !== 'undefined' && module.exports) {
  // CommonJS
  module.exports = slugg
} else {
  // Script tag
  root.slugg = slugg
}

}(this))

},{}],9:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer. All rights reserved.
 * @module mdast:util:to-string
 * @fileoverview Utility to get the text value of a node.
 */

'use strict';

/**
 * Get the value of `node`.  Checks, `value`,
 * `alt`, and `title`, in that order.
 *
 * @param {Node} node - Node to get the internal value of.
 * @return {string} - Textual representation.
 */
function valueOf(node) {
    return node &&
        (node.value ? node.value :
        (node.alt ? node.alt : node.title)) || '';
}

/**
 * Returns the text content of a node.  If the node itself
 * does not expose plain-text fields, `toString` will
 * recursivly try its children.
 *
 * @param {Node} node - Node to transform to a string.
 * @return {string} - Textual representation.
 */
function toString(node) {
    return valueOf(node) ||
        (node.children && node.children.map(toString).join('')) ||
        '';
}

/*
 * Expose.
 */

module.exports = toString;

},{}],10:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer. All rights reserved.
 * @module unist:util:visit
 * @fileoverview Utility to recursively walk over unist nodes.
 */

'use strict';

/**
 * Walk forwards.
 *
 * @param {Array.<*>} values - Things to iterate over,
 *   forwards.
 * @param {function(*, number): boolean} callback - Function
 *   to invoke.
 * @return {boolean} - False if iteration stopped.
 */
function forwards(values, callback) {
    var index = -1;
    var length = values.length;

    while (++index < length) {
        if (callback(values[index], index) === false) {
            return false;
        }
    }

    return true;
}

/**
 * Walk backwards.
 *
 * @param {Array.<*>} values - Things to iterate over,
 *   backwards.
 * @param {function(*, number): boolean} callback - Function
 *   to invoke.
 * @return {boolean} - False if iteration stopped.
 */
function backwards(values, callback) {
    var index = values.length;
    var length = -1;

    while (--index > length) {
        if (callback(values[index], index) === false) {
            return false;
        }
    }

    return true;
}

/**
 * Visit.
 *
 * @param {Node} tree - Root node
 * @param {string} [type] - Node type.
 * @param {function(node): boolean?} callback - Invoked
 *   with each found node.  Can return `false` to stop.
 * @param {boolean} [reverse] - By default, `visit` will
 *   walk forwards, when `reverse` is `true`, `visit`
 *   walks backwards.
 */
function visit(tree, type, callback, reverse) {
    var iterate;
    var one;
    var all;

    if (typeof type === 'function') {
        reverse = callback;
        callback = type;
        type = null;
    }

    iterate = reverse ? backwards : forwards;

    /**
     * Visit `children` in `parent`.
     */
    all = function (children, parent) {
        return iterate(children, function (child, index) {
            return child && one(child, index, parent);
        });
    };

    /**
     * Visit a single node.
     */
    one = function (node, index, parent) {
        var result;

        index = index || (parent ? 0 : null);

        if (!type || node.type === type) {
            result = callback(node, index, parent || null);
        }

        if (node.children && result !== false) {
            return all(node.children, node);
        }

        return result;
    };

    one(tree);
}

/*
 * Expose.
 */

module.exports = visit;

},{}]},{},[1])(1)
});