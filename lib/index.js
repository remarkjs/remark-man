/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('unified').Compiler<Root>} Compiler
 * @typedef {import('./to-roff.js').Options} Options
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
