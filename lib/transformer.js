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
