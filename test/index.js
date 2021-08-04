import fs from 'fs'
import path from 'path'
import test from 'tape'
import unified from 'unified'
import parse from 'remark-parse'
import stringify from 'remark-stringify'
import gfm from 'remark-gfm'
import frontmatter from 'remark-frontmatter'
import footnotes from 'remark-footnotes'
import vfile from 'vfile'
import hidden from 'is-hidden'
import not from 'negate'
import man from '../index.js'

var read = fs.readFileSync
var join = path.join

var root = join('test', 'fixtures')

var fixtures = fs.readdirSync(root).filter(not(hidden))

function process(file, config) {
  return unified()
    .use(parse)
    .use(stringify)
    .use(gfm)
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
  let index = -1
  while (++index < fixtures.length) {
    const fixture = fixtures[index]
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
  }

  t.end()
})
