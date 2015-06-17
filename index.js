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
