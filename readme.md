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

## Command line

![Example how remark-man looks on screen][screenshot]

Use `remark-man` together with [`remark-cli`][cli]:

```bash
npm install --global remark-cli remark-man
```

Let’s say `example.md` looks as follows:

```md
# ls(1) -- list directory contents

## SYNOPSIS

`ls` \[`-ABCFGHLOPRSTUW@abcdefghiklmnopqrstuwx1`\] \[_file_ _..._\]
```

Now, running `remark example.md --use man --output` yields a new
file, `example.1`:

```roff
.TH "LS" "1" "February 2016" "" ""
.SH "NAME"
\fBls\fR - list directory contents
.SH "SYNOPSIS"
.P
\fBls\fR \[lB]\fB-ABCFGHLOPRSTUW\[at]abcdefghiklmnopqrstuwx1\fR\[rB] \[lB]\fIfile\fR \fI...\fR\[rB]
```

Now, that looks horrible, but that’s how roff/groff/troff are :wink:.

To properly view that man page, use something like this: `man ./example.1`.

## API

Use `remark-man` together with [`remark`][api]:

```sh
npm install remark remark-man --save
```

### `remark.use(man[, options])`

Compile markdown to a man page.

###### `options`

*   `name` (`string`, optional);
*   `section` (`number` or `string`, optional);
*   `description` (`string`, optional);
*   `date` (given to `new Date()`, optional);
*   `version` (`string`, optional);
*   `manual` (`string`, optional).

The **name** and **section** can also be inferred from the file’s name:
`hello-world.1.md` will set `name` to `"hello-world"` and `section` to
`"1"`.

In addition, you can also provide inline configuration with a main
heading.  The following file:

```md
# hello-world(7) -- Two common words
```

...will set `name` to `"hello-world"`, `section` to `"7"`, and
`description` to `"Two common words"`.

The main heading has precedence over the file name, and the file name
over the plugin settings.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/wooorm/remark-man.svg

[build-status]: https://travis-ci.org/wooorm/remark-man

[coverage-badge]: https://img.shields.io/codecov/c/github/wooorm/remark-man.svg

[coverage-status]: https://codecov.io/github/wooorm/remark-man

[chat-badge]: https://img.shields.io/gitter/room/wooorm/remark.svg

[chat]: https://gitter.im/wooorm/remark

[license]: LICENSE

[author]: http://wooorm.com

[npm]: https://docs.npmjs.com/cli/install

[remark]: https://github.com/wooorm/remark

[api]: https://github.com/wooorm/remark/tree/master/packages/remark

[cli]: https://github.com/wooorm/remark/tree/master/packages/remark-cli

[screenshot]: https://cdn.rawgit.com/wooorm/remark-man/master/screenshot.png
