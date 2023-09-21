import type {Root} from 'mdast'
import type {Plugin} from 'unified'
import type {Options} from './lib/index.js'

export type {Options} from './lib/index.js'

/**
 * Turn markdown into a man page.
 *
 * @param options
 *   Configuration (optional).
 * @returns
 *   Nothing.
 */
declare const remarkMan: Plugin<[(Options | null | undefined)?], Root, string>
export default remarkMan
