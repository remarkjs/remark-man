(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.mdastMan = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/*
 * Dependencies.
 */

var transformer = require('./lib/transformer.js');
var compilers = require('./lib/compilers.js');

/**
 * Attach a roff compiler, and a man-header detection
 * method as a transformer.
 *
 * @param {MDAST} mdast
 * @param {Object?} [options]
 * @return {Function} - See `transformer`.
 */
function attacher(mdast, options) {
    var MarkdownCompiler = mdast.Compiler;
    var ancestor = MarkdownCompiler.prototype;
    var proto;
    var key;

    /**
     * Extensible prototype.
     */
    function ManCompilerPrototype() {}

    ManCompilerPrototype.prototype = ancestor;

    proto = new ManCompilerPrototype();

    /**
     * Extensible constructor.
     */
    function ManCompiler() {
        MarkdownCompiler.apply(this, arguments);
    }

    ManCompiler.prototype = proto;

    /*
     * Expose given settings.
     */

    proto.defaultManConfiguration = options || {};

    /*
     * Expose compiler.
     */

    for (key in compilers) {
        proto[key] = compilers[key];
    }

    mdast.Compiler = ManCompiler;

    return transformer;
}

/*
 * Expose `plugin`.
 */

module.exports = attacher;

},{"./lib/compilers.js":2,"./lib/transformer.js":4}],2:[function(require,module,exports){
'use strict';

/*
 * Dependencies.
 */

var visit = require('mdast-util-visit');
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
 *   heading(node) // '.P \nFoo bar...'
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
    var description = config.description || defaults.section || '';
    var links = {};
    var value;
    var extension;

    self.links = links;

    visit(node, 'definition', function (definition) {
        links[definition.identifier.toUpperCase()] = definition.link;
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

},{"./expression.js":3,"./uniglyph.json":5,"mdast-util-visit":7}],3:[function(require,module,exports){
<!-- This file is generated by `script/build-unigroff.js` -->
'use strict';

module.exports = /ffi|ffl|Ü|ö|Ÿ|∉|Ž|≠|ý|À|ü|Â|û|Ä|ú|Ć|ù|È|š|Ê|à|Ì|á|Î|â|Ñ|ã|Ó|ä|Õ|å|Š|ć|Ú|ç|⊅|è|ž|é|Á|ê|Å|ë|É|≢|Í|⊄|Ò|ì|Ö|í|Û|î|ÿ|ï|Ç|ñ|Ï|õ|ô|ó|ò|Ô|Ë|Ã|Ý|Ù|Τ|⟩|‐|"|–|`|—|\^|‘|\\|’|@|‚|\{|“|\}|”|¡|„|£|†|¥|‡|§|•|©|‰|«|′|®|″|°|‹|²|›|´|‾|¶|⁄|¸|€|º|ℏ|¼|ℑ|¾|℘|Æ|ℜ|×|™|Þ|ℵ|æ|⅛|÷|⅜|þ|⅝|Ĳ|⅞|Ł|←|Œ|↑|ƒ|→|ˇ|↓|˙|↔|˛|↕|Β|↵|Δ|⇐|Ζ|⇑|Θ|⇒|Κ|⇓|Μ|⇔|Ξ|⇕|Π|∀|Σ|∂|Υ|∃|Χ|∅|Ω|∇|β|∈|δ|\/|ζ|∋|θ|∏|κ|∐|μ|∑|ξ|−|π|∓|ς|∗|τ|√|φ|∝|ψ|∞|ϑ|∠|ϖ|∧|_|∨|\[|∩|\||∪|¢|∫|¦|∴|ª|∼|¯|≃|³|≅|·|≈|»|≡|¿|\+|Ø|≤|ð|≥|ı|≪|ł|≫|ȷ|⊂|˚|'|Γ|⊃|Η|\$|Λ|⊆|Ο|⊇|#|⊕|Ψ|⊗|γ|⊥|η|⋅|λ|⌈|ο|⌉|σ|⌊|χ|⌋|ϕ|⎛|\]|⎜|~|⎝|¨|⎞|±|⎟|¹|⎠|Ð|⎢|ø|⎥|œ|⎧|Α|⎨|Ι|⎩|Ρ|⎪|α|⎫|ι|⎬|ρ|⎭|ω|⎯|=|│|¬|□|½|◊|ĳ|○|Ε|☜|Φ|☞|ν|♠|ϵ|♣|µ|˘|⟨|✓|♦|♥|Ν|ß|¤|υ|ε/g;

},{}],4:[function(require,module,exports){
'use strict';

var toString = require('mdast-util-to-string');

var MAN_EXPRESSION =
    /([\w_.\[\]~+=@:-]+)(?:\s*)(?:\((\d\w*)\))(?:\s*-+\s*(.*))?/;

/**
 * Transform a file.  This just parses the heading and
 * adds it’s name, section, and description to the file.
 *
 * @param {Object} node
 * @param {File} file
 */
function transformer(node, file) {
    var man = {};
    var children = node && node.children;
    var length = children && children.length;
    var index = -1;
    var first;
    var child;
    var value;
    var match;

    /*
     * Expose per file overwrites on `file`.
     */

    file.manConfiguration = man;

    while (++index < length) {
        child = children[index];

        if (child.type === 'heading' && child.depth === 1) {
            first = child;
            break;
        }
    }

    if (first) {
        value = toString(first);
        match = MAN_EXPRESSION.exec(value);

        if (match) {
            man.name = match[1];
            man.section = match[2];
            man.description = match[3];
        } else {
            man.description = value;
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

},{"mdast-util-to-string":6}],5:[function(require,module,exports){
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
 * @copyright 2015 Titus Wormer. All rights reserved.
 * @module mdast-util-to-string
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

},{}],7:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer. All rights reserved.
 * @module mdast-util-visit
 * @fileoverview Utility to recursively walk over mdast nodes.
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