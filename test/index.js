/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module remark:man:test
 * @fileoverview Tests.
 */

'use strict';

/* eslint-env node */

/*
 * Dependencies.
 */

var path = require('path');
var fs = require('fs');
var test = require('tape');
var remark = require('remark');
var File = require('vfile');
var man = require('..');

/*
 * Methods.
 */

var read = fs.readFileSync;
var exists = fs.existsSync;
var join = path.join;
var basename = path.basename;
var extname = path.extname;
var dirname = path.dirname;

/**
 * Create a `File` from a `filePath`.
 *
 * @param {string} filePath - File-path to virtualize.
 * @return {File}
 */
function toFile(filePath, contents) {
    var extension = extname(filePath);
    var directory = dirname(filePath);
    var name = basename(filePath, extension);

    return new File({
        'directory': directory,
        'filename': name,
        'extension': extension.slice(1),
        'contents': contents
    });
}

/*
 * Constants.
 */

var ROOT = join(__dirname, 'fixtures');

/*
 * Fixtures.
 */

var fixtures = fs.readdirSync(ROOT);

/**
 * Shortcut to process.
 *
 * @param {File} file - Virtual file.
 * @param {Object} config - Configuration.
 * @return {string}
 */
function process(file, config) {
    return remark.use(man, config).process(file, {
        'footnotes': true
    });
}

/*
 * Tests.
 */

test('remark-man()', function (t) {
    t.equal(typeof man, 'function', 'should be a function');

    t.doesNotThrow(function () {
        man(remark());
    }, 'should not throw if not passed options');

    var fixture = 'nothing';
    var filepath = join(ROOT, fixture);
    var output = read(join(filepath, 'output.roff'), 'utf-8');
    var input = read(join(filepath, 'input.md'), 'utf-8');
    var config = join(filepath, 'config.json');
    var file = toFile(fixture + '.md', input);

    file.filename = undefined;

    config = exists(config) ? JSON.parse(read(config, 'utf-8')) : {};

    t.equal(process(file, config), output, 'should work without filename');

    t.end();
});

/*
 * Assert fixtures.
 */

test('Fixtures', function (t) {
    fixtures.filter(function (filepath) {
        return filepath.indexOf('.') !== 0;
    }).forEach(function (fixture) {
        var filepath = join(ROOT, fixture);
        var output = read(join(filepath, 'output.roff'), 'utf-8');
        var input = read(join(filepath, 'input.md'), 'utf-8');
        var config = join(filepath, 'config.json');
        var file = toFile(fixture + '.md', input);

        config = exists(config) ? JSON.parse(read(config, 'utf-8')) : {};

        t.equal(
            process(file, config),
            output,
            'should work on `' + fixture + '`'
        );
    });

    t.end();
});
