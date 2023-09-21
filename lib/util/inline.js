/**
 * @typedef {import('mdast').Parents} Parents
 * @typedef {import('mdast').PhrasingContent} PhrasingContent
 * @typedef {import('../to-roff.js').State} State
 * @typedef {import('../to-roff.js').TextStyle} TextStyle
 */

import {textDecoration} from './text-decoration.js'

/**
 * Wrap a node in an inline roff command.
 *
 * @param {TextStyle} decoration
 * @param {Extract<PhrasingContent, Parents>} node
 * @param {State} state
 * @returns {string}
 */
export function inline(decoration, node, state) {
  const currentStyle = state.textStyle[state.textStyle.length - 1]

  state.textStyle.push(decoration)

  const result = textDecoration(
    decoration,
    state.containerPhrasing(node),
    currentStyle
  )

  state.textStyle.pop()

  return result
}
