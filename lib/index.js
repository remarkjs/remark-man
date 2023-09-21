/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('unified').Compiler<Root>} Compiler
 */

/**
 * @typedef Options
 *   Configuration.
 * @property {string | null | undefined} [name]
 *   Title of the page (optional);
 *   defaults to the main heading (`# hello-world(7)` means `'hello-world'`) or
 *   the file’s name (`hello-world.1.md` means `'hello-world'`).
 * @property {number | string | null | undefined} [section]
 *   Man section of page (optional);
 *   defaults to the main heading (`# hello-world(7)` means `7`) or the file’s
 *   name (`hello-world.1.md` means `1`).
 * @property {string | null | undefined} [description]
 *   Description of page (optional);
 *   defaults to the main heading (`# hello-world(7) -- Two common words` means
 *   `'Two common words'`).
 * @property {Readonly<Date> | number | string | null | undefined} [date]
 *   Date of page.
 *   Given to `new Date(date)` as `date`, so when `null` or `undefined`,
 *   defaults to the current date.
 *   Dates are centered in the footer line of the displayed page.
 * @property {string | null | undefined} [version]
 *   Version of page.
 *   Versions are positioned at the left of the footer line of the displayed
 *   page (or at the left on even pages and at the right on odd pages if
 *   double-sided printing is active).
 * @property {string | null | undefined} [manual]
 *   Manual of page.
 *   Manuals are centered in the header line of the displayed page.
 */

import {toRoff} from './to-roff.js'

/**
 * Turn markdown into a man page.
 *
 * @param {Readonly<Options> | null | undefined} [options]
 *   Configuration (optional).
 * @returns {undefined}
 *   Nothing.
 */
export default function remarkMan(options) {
  // @ts-expect-error: TypeScript doesn’t handle `this` well.
  // eslint-disable-next-line unicorn/no-this-assignment
  const self = /** @type {Processor} */ (this)

  self.compiler = compiler

  /** @type {Compiler} */
  function compiler(tree, file) {
    return toRoff(tree, file, options)
  }
}
