/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:man
 * @fileoverview Compile Markdown to man pages (roff) with remark.
 */

'use strict';

/* eslint-env commonjs */

/*
 * Dependencies.
 */

var slug = require('remark-slug');
var transformer = require('./lib/transformer.js');
var compilers = require('./lib/compilers.js');

/**
 * Attach a roff compiler, and a man-header detection
 * method as a transformer.
 *
 * @param {Remark} remark - Processor.
 * @param {Object?} [options] - Configuration.
 * @return {Function} - See `transformer`.
 */
function attacher(remark, options) {
    var settings = options || {};
    var ancestor = remark.Compiler.prototype;
    var key;

    remark.use(slug, settings.slug);

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
