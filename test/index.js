'use strict';

/* eslint-env mocha */

/*
 * Dependencies.
 */

var path = require('path');
var fs = require('fs');
var assert = require('assert');
var mdast = require('mdast');
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
    return mdast.use(man, config).process(file, {
        'footnotes': true
    });
}

/*
 * Tests.
 */

describe('mdast-man()', function () {
    it('should be a function', function () {
        assert(typeof man === 'function');
    });

    it('should not throw if not passed options', function () {
        assert.doesNotThrow(function () {
            man(mdast());
        });
    });

    it('should work without filename', function () {
        var fixture = 'nothing';
        var filepath = join(ROOT, fixture);
        var output = read(join(filepath, 'output.roff'), 'utf-8');
        var input = read(join(filepath, 'input.md'), 'utf-8');
        var config = join(filepath, 'config.json');
        var file = toFile(fixture + '.md', input);

        file.filename = undefined;

        config = exists(config) ? JSON.parse(read(config, 'utf-8')) : {};

        assert.equal(process(file, config), output);
    });
});

/**
 * Describe a fixtures.
 *
 * @param {string} fixture - Path to fixture to describe.
 */
function describeFixture(fixture) {
    it('should work on `' + fixture + '`', function () {
        var filepath = join(ROOT, fixture);
        var output = read(join(filepath, 'output.roff'), 'utf-8');
        var input = read(join(filepath, 'input.md'), 'utf-8');
        var config = join(filepath, 'config.json');
        var file = toFile(fixture + '.md', input);

        config = exists(config) ? JSON.parse(read(config, 'utf-8')) : {};

        assert.equal(process(file, config), output);
    });
}

/*
 * Gather fixtures.
 */

fixtures = fixtures.filter(function (filepath) {
    return filepath.indexOf('.') !== 0;
});

/*
 * Assert fixtures.
 */

describe('Fixtures', function () {
    fixtures.forEach(describeFixture);
});
