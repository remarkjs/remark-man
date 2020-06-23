'use strict'

var fs = require('fs')
var path = require('path')
var test = require('tape')
var unified = require('unified')
var parse = require('remark-parse')
var stringify = require('remark-stringify')
var frontmatter = require('remark-frontmatter')
var footnotes = require('remark-footnotes')
var vfile = require('vfile')
var hidden = require('is-hidden')
var not = require('negate')
var man = require('..')

var read = fs.readFileSync
var join = path.join

var root = join(__dirname, 'fixtures')

var fixtures = fs.readdirSync(root).filter(not(hidden))

function process(file, config) {
  return unified()
    .use(parse)
    .use(stringify)
    .use(footnotes, {inlineNotes: true})
    .use(frontmatter)
    .use(man, config)
    .processSync(file)
    .toString()
}

// Hack so the tests don’t need updating everytime…
var ODate = global.Date

global.Date = function (value) {
  // Timestamp of <https://github.com/remarkjs/remark-man/commit/53d7fd7>.
  return new ODate(value || 1454861068000)
}

test.onFinish(function () {
  global.Date = ODate
})

test('remarkMan()', function (t) {
  t.equal(typeof man, 'function', 'should be a function')

  t.doesNotThrow(function () {
    man.call(unified().use(man).freeze())
  }, 'should not throw if not passed options')

  t.equal(
    process(vfile({contents: read(join(root, 'nothing', 'input.md'))})),
    read(join(root, 'nothing', 'output.roff'), 'utf8'),
    'should work without filename'
  )

  t.end()
})

test('Fixtures', function (t) {
  fixtures.forEach(function (fixture) {
    var filepath = join(root, fixture)
    var output = read(join(filepath, 'output.roff'), 'utf8')
    var input = read(join(filepath, 'input.md'))
    var file = vfile({path: fixture + '.md', contents: input})
    var config

    try {
      config = JSON.parse(read(join(filepath, 'config.json'), 'utf8'))
    } catch (_) {
      config = {}
    }

    t.equal(process(file, config), output, fixture)
  })

  t.end()
})
