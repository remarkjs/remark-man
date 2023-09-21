/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('vfile').VFile} VFile
 *
 * @typedef Options
 *   Configuration.
 * @property {string} [name]
 *   Title of the page.
 *   Is inferred from the main heading (`# hello-world(7)` sets `name` to
 *   `'hello-world'`) or from the file’s name (`hello-world.1.md` sets `name`
 *   to `'hello-world'`).
 * @property {number|string} [section]
 *   Man section of page.
 *   Is inferred from the main heading (`# hello-world(7)` sets `section` to
 *   `7`) or from the file’s name (`hello-world.1.md` sets `section` to `1`).
 * @property {string} [description]
 *   Description of page.
 *   Is inferred from the main heading (`# hello-world(7) -- Two common words`
 *   sets `description` to `'Two common words'`).
 * @property {number|string|Date|null} [date]
 *   Date of page.
 *   Given to `new Date(date)` as `date`, so when `null` or `undefined`,
 *   defaults to the current date.
 *   Dates are centered in the footer line of the displayed page.
 * @property {string} [version]
 *   Version of page.
 *   Versions are positioned at the left of the footer line of the displayed
 *   page (or at the left on even pages and at the right on odd pages if
 *   double-sided printing is active).
 * @property {string} [manual]
 *   Manual of page.
 *   Manuals are centered in the header line of the displayed page.
 */

import {createCompiler} from './lib/create-compiler.js'

/**
 * Plugin to compile markdown to man pages.
 *
 * @type {import('unified').Plugin<[Options?] | void[], Root, string>}
 */
export default function remarkMan(options = {}) {
  // @ts-expect-error: TypeScript doesn’t handle `this` well.
  // eslint-disable-next-line unicorn/no-this-assignment
  const self = /** @type {Processor} */ (this)

  self.compiler = createCompiler(options)
}
