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
