'use strict';

var fs = require('fs');
var path = require('path');
var test = require('tape');
var unified = require('unified');
var parse = require('remark-parse');
var stringify = require('remark-stringify');
var frontmatter = require('remark-frontmatter');
var vfile = require('vfile');
var hidden = require('is-hidden');
var not = require('negate');
var man = require('..');

var read = fs.readFileSync;
var exists = fs.existsSync;
var join = path.join;

var ROOT = join(__dirname, 'fixtures');

var fixtures = fs.readdirSync(ROOT).filter(not(hidden));

function process(file, config) {
  return unified()
    .use(parse, {footnotes: true})
    .use(stringify)
    .use(frontmatter)
    .use(man, config)
    .processSync(file)
    .toString();
}

/* Hack so the tests don’t need updating everytime... */
var ODate = global.Date;

global.Date = function (val) {
  /* Timestamp: of https://github.com/remarkjs/remark-man/commit/53d7fd7 */
  return new ODate(val || 1454861068000);
};

test.onFinish(function () {
  global.Date = ODate;
});

test('remark-man()', function (t) {
  t.equal(typeof man, 'function', 'should be a function');

  t.doesNotThrow(function () {
    man.call(unified().use(man).freeze());
  }, 'should not throw if not passed options');

  t.equal(
    process(vfile({
      contents: read(join(ROOT, 'nothing', 'input.md'))
    })),
    read(join(ROOT, 'nothing', 'output.roff'), 'utf8'),
    'should work without filename'
  );

  t.end();
});

test('Fixtures', function (t) {
  fixtures.forEach(function (fixture) {
    var filepath = join(ROOT, fixture);
    var output = read(join(filepath, 'output.roff'), 'utf8');
    var input = read(join(filepath, 'input.md'));
    var config = join(filepath, 'config.json');
    var file = vfile({path: fixture + '.md', contents: input});

    config = exists(config) ? JSON.parse(read(config, 'utf8')) : {};

    t.equal(process(file, config), output, fixture);
  });

  t.end();
});
