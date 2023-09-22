# remark-man

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[remark][]** plugin to turn markdown to man pages.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`unified().use(remarkMan[, options])`](#unifieduseremarkman-options)
    *   [`Options`](#options)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Security](#security)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package is a [unified][] ([remark][]) plugin that compiles markdown
(mdast) to roff/groff/troff (the format used for man pages).

It adds a compiler for unified that turns the final markdown (mdast) syntax
tree into roff/groff/troff (the format used for man pages).

## When should I use this?

Use this when you know a bit about remark and ASTs and need mang pages.
This plugin combined with remark is quite good at turning markdown into man
pages.
It has good unicode support, proper support for nested lists and block quotes,
supports tables, and more.

## Install

This package is [ESM only][esm].
In Node.js (version 16+), install with [npm][]:

```sh
npm install remark-man
```

In Deno with [`esm.sh`][esmsh]:

```js
import remarkMan from 'https://esm.sh/remark-man@8'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import remarkMan from 'https://esm.sh/remark-man@8?bundle'
</script>
```

## Use

Say we have the following file `example.md`:

```markdown
# ls(1) -- list directory contents

## SYNOPSIS

`ls` \[`-ABCFGHLOPRSTUW@abcdefghiklmnopqrstuwx1`] \[*file* *...*]
```

…and a module `example.js`:

```js
import remarkMan from 'remark-man'
import remarkParse from 'remark-parse'
import {read, write} from 'to-vfile'
import {unified} from 'unified'

const file = await unified()
  .use(remarkParse)
  .use(remarkMan)
  .process(await read('example.md'))

file.extname = '.1'
await write(file)
```

…then running `node example.js` generates an `example.1` file, which contains:

```roff
.TH "LS" "1" "September 2023" "" ""
.SH "NAME"
\fBls\fR - list directory contents
.SH "SYNOPSIS"
.P
\fBls\fR \[lB]\fB-ABCFGHLOPRSTUW@abcdefghiklmnopqrstuwx1\fR\[rB] \[lB]\fIfile\fR \fI...\fR\[rB]
```

Running `man ./example.1` opens that in a manual viewer, which interprets it.

## API

This package exports no identifiers.
The default export is [`remarkMan`][api-remark-man].

### `unified().use(remarkMan[, options])`

Turn markdown into a man page.

###### Parameters

*   `options` ([`Options`][api-options], optional)
    — configuration

###### Returns

Transform ([`Transformer`][unified-transformer]).

### `Options`

Configuration (TypeScript type).

###### Fields

*   `date` (`Date | number | string`, default: `new Date()`)
    — date of page;
    given to `new Date(x)`;
    dates are centered in the footer line of the displayed page
*   `description` (`string`, optional)
    — description of page;
    inferried from the main heading: `# hello-world(7) -- Two common words`
    defaults to `'Two common words'`
*   `manual` (`string`, optional)
    — manual of page;
    manuals are centered in the header line of the displayed page
*   `name` (`string`, optional)
    — title of the page;
    inferried from the main heading (`# hello-world(7)` defaults to
    `'hello-world'`) or the file name (`hello-world.1.md` defaults to
    `'hello-world'`)
*   `section` (`number`, optional)
    — [manual section][wiki-man-section] of page;
    inferred from the main heading (`# hello-world(7)` defaults to `7`) or the
    file name (`hello-world.1.md` defaults to `1`)
*   `version` (`string`, optional)
    — version of page;
    versions are positioned at the left of the footer line of the displayed
    page

## Types

This package is fully typed with [TypeScript][].
It exports the additional type [`Options`][api-options].

## Compatibility

Projects maintained by the unified collective are compatible with maintained
versions of Node.js.

When we cut a new major release, we drop support for unmaintained versions of
Node.
This means we try to keep the current release line, `remark-man@^9`, compatible
with Node.js 16.

This plugin works with `unified` version 11+ and `remark` version 15+.

## Security

Use of `remark-man` does not involve **[rehype][]** (**[hast][]**) or user
content so there are no openings for [cross-site scripting (XSS)][wiki-xss]
attacks.

## Related

*   [`remark-rehype`](https://github.com/remarkjs/remark-rehype)
    — turn markdown into HTML to support rehype
*   [`remark-stringify`](https://github.com/remarkjs/remark/tree/main/packages/remark-stringify)
    — compile markdown

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

[size-badge]: https://img.shields.io/bundlejs/size/remark-man

[size]: https://bundlejs.com/?q=remark-man

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/remarkjs/remark/discussions

[npm]: https://docs.npmjs.com/cli/install

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[esmsh]: https://esm.sh

[health]: https://github.com/remarkjs/.github

[contributing]: https://github.com/remarkjs/.github/blob/HEAD/contributing.md

[support]: https://github.com/remarkjs/.github/blob/HEAD/support.md

[coc]: https://github.com/remarkjs/.github/blob/HEAD/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[hast]: https://github.com/syntax-tree/hast

[rehype]: https://github.com/rehypejs/rehype

[remark]: https://github.com/remarkjs/remark

[unified]: https://github.com/unifiedjs/unified

[unified-transformer]: https://github.com/unifiedjs/unified#transformer

[wiki-man-section]: https://en.wikipedia.org/wiki/Man_page#Manual_sections

[wiki-xss]: https://en.wikipedia.org/wiki/Cross-site_scripting

[typescript]: https://www.typescriptlang.org

[api-options]: #options

[api-remark-man]: #unifieduseremarkman-options
