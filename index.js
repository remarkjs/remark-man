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
    var MarkdownCompiler = mdast.Compiler;
    var ancestor = MarkdownCompiler.prototype;
    var proto;
    var key;

    mdast.use(slug, settings.slug);

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

    proto.defaultManConfiguration = settings;

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
