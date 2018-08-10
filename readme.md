# remark-man [![Build Status][build-badge]][build-status] [![Coverage Status][coverage-badge]][coverage-status] [![Chat][chat-badge]][chat]

Compile markdown to man pages with [**remark**][remark].  Great unicode
support; name, section, and description detection; nested block quotes
and lists; tables; and much more.

## Installation

[npm][]:

```bash
npm install remark-man
```

## Usage

Say we have the following file, `example.md`:

```markdown
# ls(1) -- list directory contents

## SYNOPSIS

`ls` [`-ABCFGHLOPRSTUW@abcdefghiklmnopqrstuwx1`] \[_file_ _..._]
```

And our script, `example.js`, looks as follows:

```javascript
var vfile = require('to-vfile');
var unified = require('unified');
var markdown = require('remark-parse');
var man = require('remark-man');

unified()
  .use(markdown)
  .use(man)
  .process(vfile.readSync('example.md'), function (err, file) {
    if (err) throw err;
    file.extname = '.1';
    vfile.writeSync(file);
  });
```

Now, running `node example` and `cat example.1` yields:

```roff
.TH "LS" "1" "June 2015" "" ""
.SH "NAME"
\fBls\fR - list directory contents
.SH "SYNOPSIS"
.P
\fBls\fR \fB\fB-ABCFGHLOPRSTUW@abcdefghiklmnopqrstuwx1\fR\fR \[lB]\fIfile\fR \fI...\fR\[rB]
```

Now, that looks horrible, but that’s how roff/groff/troff are :wink:.

To properly view that man page, use something like this: `man ./example.1`.

### `remark.use(man[, options])`

Compile markdown to a man page.

##### Options

###### `name`

`string`, optional — Title of the page.
Is inferred from the main heading: `# hello-world(7)` sets `name` to
`'hello-world'`; or from the file’s name: `hello-world.1.md` sets `name` to
`'hello-world'`.

###### `section`

`number` or `string`, optional — [Section][man-section] of page.
Is inferred from the main heading: `# hello-world(7)` sets `section` to
`7`; or from the file’s name: `hello-world.1.md` sets `section` to `1`.

###### `description`

`string`, optional — Description of page.
Is inferred from the main heading: `# hello-world(7) -- Two common words` sets
`description` to `'Two common words'`.

###### `date`

`number`, `string`, or `Date`, optional — Date of page.  Given to
`new Date(date)` as `date`, so when `null` or `undefined`, defaults to the
current date.  Dates are centred in the footer line of the displayed page.

###### `version`

`string`, optional — Version of page.  Versions are positioned at the left of
the footer line of the displayed page (or at the left on even pages and at the
right on odd pages if double-sided printing is active).

###### `manual`

`string`, optional — Manual of page.  Manuals are centred in the header line of
the displayed page.

###### `commonmark`

Set to `true` (default: `false`) to prefer the first when duplicate definitions
are found.  The default behaviour is to prefer the last duplicate definition.

## Related

*   [`remark-react`](https://github.com/mapbox/remark-react)
    — Compile to React
*   [`remark-vdom`](https://github.com/remarkjs/remark-vdom)
    — Compile to VDOM
*   [`remark-html`](https://github.com/remarkjs/remark-html)
    — Compile to HTML
*   [`remark-rehype`](https://github.com/remarkjs/remark-rehype)
    — Properly transform to HTML

## Contribute

See [`contributing.md` in `remarkjs/remark`][contributing] for ways to get
started.

This organisation has a [Code of Conduct][coc].  By interacting with this
repository, organisation, or community you agree to abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/remarkjs/remark-man.svg

[build-status]: https://travis-ci.org/remarkjs/remark-man

[coverage-badge]: https://img.shields.io/codecov/c/github/remarkjs/remark-man.svg

[coverage-status]: https://codecov.io/github/remarkjs/remark-man

[chat-badge]: https://img.shields.io/gitter/room/remarkjs/Lobby.svg

[chat]: https://gitter.im/remarkjs/Lobby

[license]: LICENSE

[author]: http://wooorm.com

[npm]: https://docs.npmjs.com/cli/install

[remark]: https://github.com/remarkjs/remark

[contributing]: https://github.com/remarkjs/remark/blob/master/contributing.md

[coc]: https://github.com/remarkjs/remark/blob/master/code-of-conduct.md

[man-section]: https://en.wikipedia.org/wiki/Man_page#Manual_sections
