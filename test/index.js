/**
 * @typedef {import('remark-man').Options} Options
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import process from 'node:process'
import test from 'node:test'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMan from 'remark-man'
import remarkParse from 'remark-parse'
import {unified} from 'unified'
import {VFile} from 'vfile'

// Hack so the tests don’t need updating everytime…
const ODate = global.Date

// @ts-expect-error: good enough for our tests.
global.Date = function (/** @type {string | number | undefined} */ value) {
  // Timestamp of <https://github.com/remarkjs/remark-man/commit/53d7fd7>.
  return new ODate(value || 1_454_861_068_000)
}

process.on('exit', function () {
  global.Date = ODate
})

test('remarkMan', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('remark-man')).sort(), [
      'default'
    ])
  })

  await t.test('should work without filename', async function () {
    assert.equal(
      String(
        await unified()
          .use(remarkParse)
          .use(remarkFrontmatter)
          .use(remarkGfm)
          .use(remarkMan)
          .process(
            await fs.readFile(
              new URL('fixtures/nothing/input.md', import.meta.url)
            )
          )
      ),
      String(
        await fs.readFile(
          new URL('fixtures/nothing/output.roff', import.meta.url)
        )
      )
    )
  })

  await t.test('should throw on unknown nodes', async function () {
    try {
      await unified().use(remarkMan).stringify(
        // @ts-expect-error: unknown node.
        {type: 'toml', value: 'x'}
      )
      assert.fail()
    } catch (error) {
      assert.match(String(error), /Cannot compile `toml` node/)
    }
  })
})

test('fixtures', async function (t) {
  const base = new URL('fixtures/', import.meta.url)
  const folders = await fs.readdir(base)

  let index = -1

  while (++index < folders.length) {
    const folder = folders[index]

    if (folder.startsWith('.')) continue

    await t.test(folder, async function () {
      const folderUrl = new URL(folder + '/', base)
      const inputUrl = new URL('input.md', folderUrl)
      const outputUrl = new URL('output.roff', folderUrl)
      const configUrl = new URL('config.json', folderUrl)

      const input = String(await fs.readFile(inputUrl))
      const file = new VFile({path: folder + '.md', value: input})

      /** @type {Readonly<Options> | undefined} */
      let config
      /** @type {string} */
      let output

      try {
        config = JSON.parse(String(await fs.readFile(configUrl)))
      } catch {}

      const actual = String(
        await unified()
          .use(remarkParse)
          .use(remarkFrontmatter)
          .use(remarkGfm)
          .use(remarkMan, config)
          .process(file)
      )

      try {
        if ('UPDATE' in process.env) {
          throw new Error('Updating…')
        }

        output = String(await fs.readFile(outputUrl))
      } catch {
        output = actual
        await fs.writeFile(outputUrl, actual)
      }

      assert.equal(actual, output)
    })
  }
})
