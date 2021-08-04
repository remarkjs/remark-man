import fs from 'fs'
import path from 'path'
import test from 'tape'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkFootnotes from 'remark-footnotes'
import {VFile} from 'vfile'
import {isHidden} from 'is-hidden'
import not from 'negate'
import man from '../index.js'

const read = fs.readFileSync
const join = path.join

const root = join('test', 'fixtures')

const fixtures = fs.readdirSync(root).filter(not(isHidden))

function process(file, config) {
  return unified()
    .use(remarkParse)
    .use(remarkStringify)
    .use(remarkGfm)
    .use(remarkFootnotes, {inlineNotes: true})
    .use(remarkFrontmatter)
    .use(man, config)
    .processSync(file)
    .toString()
}

// Hack so the tests don’t need updating everytime…
const ODate = global.Date

global.Date = function (value) {
  // Timestamp of <https://github.com/remarkjs/remark-man/commit/53d7fd7>.
  return new ODate(value || 1454861068000)
}

test.onFinish(() => {
  global.Date = ODate
})

test('remarkMan()', (t) => {
  t.equal(typeof man, 'function', 'should be a function')

  t.doesNotThrow(() => {
    man.call(unified().use(man).freeze())
  }, 'should not throw if not passed options')

  t.equal(
    process(new VFile({value: read(join(root, 'nothing', 'input.md'))})),
    read(join(root, 'nothing', 'output.roff'), 'utf8'),
    'should work without filename'
  )

  t.end()
})

test('Fixtures', (t) => {
  let index = -1

  while (++index < fixtures.length) {
    const fixture = fixtures[index]
    const filepath = join(root, fixture)
    const output = read(join(filepath, 'output.roff'), 'utf8')
    const input = read(join(filepath, 'input.md'))
    const file = new VFile({path: fixture + '.md', value: input})
    let config = {}

    try {
      config = JSON.parse(read(join(filepath, 'config.json'), 'utf8'))
    } catch {}

    t.equal(process(file, config), output, fixture)
  }

  t.end()
})
