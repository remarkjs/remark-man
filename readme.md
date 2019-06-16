# remark-man

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[**remark**][remark] plugin to compile Markdown to man pages.

*   [x] Great unicode support
*   [x] Name, section, and description detection
*   [x] Nested block quotes and lists
*   [x] Tables
*   [x] and much more

## Install

[npm][]:

```sh
npm install remark-man
```

## Use

Say we have the following file, `example.md`:

```markdown
# ls(1) -- list directory contents

## SYNOPSIS

`ls` \[`-ABCFGHLOPRSTUW@abcdefghiklmnopqrstuwx1`] \[*file* *...*]
```

And our script, `example.js`, looks as follows:

```js
var vfile = require('to-vfile')
var unified = require('unified')
var markdown = require('remark-parse')
var man = require('remark-man')

unified()
  .use(markdown)
  .use(man)
  .process(vfile.readSync('example.md'), function(err, file) {
    if (err) throw err
    file.extname = '.1'
    vfile.writeSync(file)
  })
```

Now, running `node example` and `cat example.1` yields:

```roff
.TH "LS" "1" "June 2019" "" ""
.SH "NAME"
\fBls\fR - list directory contents
.SH "SYNOPSIS"
.P
\fBls\fR \[lB]\fB-ABCFGHLOPRSTUW@abcdefghiklmnopqrstuwx1\fR\[rB] \[lB]\fIfile\fR \fI...\fR\[rB]
```

Now, that in my opinion isn’t very readable, but that’s roff/groff/troff.  😉

To properly view that man page, use something like this: `man ./example.1`.

### `remark().use(man[, options])`

Plugin to compile Markdown to man pages.

##### `options`

###### `options.name`

Title of the page (`string`, optional).
Is inferred from the main heading (`# hello-world(7)` sets `name` to
`'hello-world'`) or from the file’s name (`hello-world.1.md` sets `name` to
`'hello-world'`).

###### `options.section`

[Section][man-section] of page (`number` or `string`, optional).
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
Dates are centred in the footer line of the displayed page.

###### `options.version`

Version of page (`string`, optional).
Versions are positioned at the left of the footer line of the displayed page
(or at the left on even pages and at the right on odd pages if double-sided
printing is active).

###### `options.manual`

Manual of page (`string`, optional).
Manuals are centred in the header line of the displayed page.

###### `options.commonmark`

Parsing mode (`boolean`, default: `false`).
The default behaviour is to prefer the last duplicate definition.
Set to `true` to prefer the first when duplicate definitions are found.

## Related

*   [`remark-react`](https://github.com/remarkjs/remark-react)
    — Compile to React
*   [`remark-vdom`](https://github.com/remarkjs/remark-vdom)
    — Compile to VDOM
*   [`remark-html`](https://github.com/remarkjs/remark-html)
    — Compile to HTML
*   [`remark-rehype`](https://github.com/remarkjs/remark-rehype)
    — Properly transform to HTML

## Contribute

See [`contributing.md`][contributing] in [`remarkjs/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [Code of Conduct][coc].
By interacting with this repository, organisation, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/remarkjs/remark-man/master.svg

[build]: https://travis-ci.org/remarkjs/remark-man

[coverage-badge]: https://img.shields.io/codecov/c/github/remarkjs/remark-man.svg

[coverage]: https://codecov.io/github/remarkjs/remark-man

[downloads-badge]: https://img.shields.io/npm/dm/remark-man.svg

[downloads]: https://www.npmjs.com/package/remark-man

[size-badge]: https://img.shields.io/bundlephobia/minzip/remark-man.svg

[size]: https://bundlephobia.com/result?p=remark-man

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/join%20the%20community-on%20spectrum-7b16ff.svg

[chat]: https://spectrum.chat/unified/remark

[npm]: https://docs.npmjs.com/cli/install

[health]: https://github.com/remarkjs/.github

[contributing]: https://github.com/remarkjs/.github/blob/master/contributing.md

[support]: https://github.com/remarkjs/.github/blob/master/support.md

[coc]: https://github.com/remarkjs/.github/blob/master/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[remark]: https://github.com/remarkjs/remark

[man-section]: https://en.wikipedia.org/wiki/Man_page#Manual_sections
