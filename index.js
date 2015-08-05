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
