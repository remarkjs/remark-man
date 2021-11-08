# remark-man

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[remark][]** plugin to compile markdown to man pages.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`unified().use(remarkMan[, options])`](#unifieduseremarkman-options)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Security](#security)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package is a [unified][] ([remark][]) plugin that compiles markdown to
roff/groff/troff (the format used for man pages).

**unified** is a project that transforms content with abstract syntax trees
(ASTs).
**remark** adds support for markdown to unified.
**mdast** is the markdown AST that remark uses.
This is a remark plugin that adds a compiler to compile mdast to a string.

## When should I use this?

This plugin adds a compiler for remark, which means that it turns the final
markdown (mdast) syntax tree into a string.

This plugin, combined with remark, is quite good at turning markdown into man
pages.
It has good unicode support, proper support for nested lists and block quotes,
supports tables, and more.

## Install

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).
In Node.js (version 12.20+, 14.14+, or 16.0+), install with [npm][]:

```sh
npm install remark-man
```

In Deno with [Skypack][]:

```js
import remarkMan from 'https://cdn.skypack.dev/remark-man@8?dts'
```

In browsers with [Skypack][]:

```html
<script type="module">
  import remarkMan from 'https://cdn.skypack.dev/remark-man@8?min'
</script>
```

## Use

Say we have some markdown in `example.md`:

```markdown
# ls(1) -- list directory contents

## SYNOPSIS

`ls` \[`-ABCFGHLOPRSTUW@abcdefghiklmnopqrstuwx1`] \[*file* *...*]
```

And our module `example.js` looks as follows:

```js
import {read, write} from 'to-vfile'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkMan from 'remark-man'

main()

async function main() {
  const file = await unified()
    .use(remarkParse)
    .use(remarkMan)
    .process(await read('example.md'))

  file.extname = '.1'
  await write(file)
}
```

Now running `node example.js` creates a file `example.1` that contains:

```roff
.TH "LS" "1" "November 2021" "" ""
.SH "NAME"
\fBls\fR - list directory contents
.SH "SYNOPSIS"
.P
\fBls\fR \[lB]\fB-ABCFGHLOPRSTUW@abcdefghiklmnopqrstuwx1\fR\[rB] \[lB]\fIfile\fR \fI...\fR\[rB]
```

That’s not very readable but a man page viewer can solve that.
Run `man ./example.1` to view the rendered result.

## API

This package exports no identifiers.
The default export is `remarkMan`.

### `unified().use(remarkMan[, options])`

Plugin to compile Markdown to man pages.

##### `options`

Configuration (optional).

###### `options.name`

Title of the page (`string`, optional).
Is inferred from the main heading (`# hello-world(7)` sets `name` to
`'hello-world'`) or from the file’s name (`hello-world.1.md` sets `name` to
`'hello-world'`).

###### `options.section`

[Man section][man-section] of page (`number` or `string`, optional).
Is inferred from the main heading (`# hello-world(7)` sets `section` to `7`) or
from the file’s name (`hello-world.1.md` sets `section` to `1`).

###### `options.description`

Description of page (`string`, optional).
Is inferred from the main heading (`# hello-world(7) -- Two common words` sets
`description` to `'Two common words'`).

###### `options.date`

Date of page (`number`, `string`, or `Date`, optional).
Given to `new Date(date)` as `date`, so when `null` or `undefined`, defaults to
the current date.
Dates are centered in the footer line of the displayed page.

###### `options.version`

Version of page (`string`, optional).
Versions are positioned at the left of the footer line of the displayed page
(or at the left on even pages and at the right on odd pages if double-sided
printing is active).

###### `options.manual`

Manual of page (`string`, optional).
Manuals are centered in the header line of the displayed page.

## Types

This package is fully typed with [TypeScript][].
It exports an `Options` type, which specifies the interface of the accepted
options.

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 12.20+, 14.14+, and 16.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

This plugin works with `unified` version 6+ and `remark` version 7+.

## Security

Use of `remark-man` does not involve **[rehype][]** (**[hast][]**) or user
content so there are no openings for [cross-site scripting (XSS)][xss] attacks.

## Related

*   [`remark-rehype`](https://github.com/remarkjs/remark-rehype)
    — turn markdown into HTML to support rehype
*   [`remark-stringify`](https://github.com/remarkjs/remark/tree/main/packages/remark-stringify)
    — compile markdown
*   [`remark-vdom`](https://github.com/remarkjs/remark-vdom)
    — compile markdown to VDOM

## Contribute

See [`contributing.md`][contributing] in [`remarkjs/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/remarkjs/remark-man/workflows/main/badge.svg

[build]: https://github.com/remarkjs/remark-man/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/remarkjs/remark-man.svg

[coverage]: https://codecov.io/github/remarkjs/remark-man

[downloads-badge]: https://img.shields.io/npm/dm/remark-man.svg

[downloads]: https://www.npmjs.com/package/remark-man

[size-badge]: https://img.shields.io/bundlephobia/minzip/remark-man.svg

[size]: https://bundlephobia.com/result?p=remark-man

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/remarkjs/remark/discussions

[npm]: https://docs.npmjs.com/cli/install

[skypack]: https://www.skypack.dev

[health]: https://github.com/remarkjs/.github

[contributing]: https://github.com/remarkjs/.github/blob/HEAD/contributing.md

[support]: https://github.com/remarkjs/.github/blob/HEAD/support.md

[coc]: https://github.com/remarkjs/.github/blob/HEAD/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[remark]: https://github.com/remarkjs/remark

[unified]: https://github.com/unifiedjs/unified

[man-section]: https://en.wikipedia.org/wiki/Man_page#Manual_sections

[xss]: https://en.wikipedia.org/wiki/Cross-site_scripting

[typescript]: https://www.typescriptlang.org

[rehype]: https://github.com/rehypejs/rehype

[hast]: https://github.com/syntax-tree/hast
