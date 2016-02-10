# remark-man [![Build Status][travis-badge]][travis] [![Coverage Status][codecov-badge]][codecov]

Compile markdown to man pages.  Great unicode support, name, section,
and description detection, nested block quotes and lists, tables, and
more.

## Installation

[npm][npm-install]:

```bash
npm install remark-man
```

**remark-man** is also available for [duo][duo-install], and as an
AMD, CommonJS, and globals module, [uncompressed and compressed][releases].

## Usage

## Command line

![Example how remark-man looks on screen][screenshot]

Use `remark-man` together with **remark**:

```bash
npm install --global remark remark-man
```

Let’s say `example.md` looks as follows:

```md
# ls(1) -- list directory contents

## SYNOPSIS

`ls` \[`-ABCFGHLOPRSTUW@abcdefghiklmnopqrstuwx1`\] \[_file_ _..._\]
```

Then, run **remark-man** on `example.md`:

```bash
remark -u remark-man example.md -o
```

Yields (check out the newly created `example.1` file):

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

### `remark.use(man[, options])`

**Options** (`Object?`):

*   `name` (`string`, optional);

*   `section` (`number` or `string`, optional);

*   `description` (`string`, optional);

*   `date` (given to `new Date()`, optional);

*   `version` (`string`, optional);

*   `manual` (`string`, optional);

*   `slug` ([`*`](https://github.com/wooorm/remark-slug#remarkuseslug-options),
    optional) — Passed to [remark-slug](https://github.com/wooorm/remark-slug),
    used for anchor-link detection.

The **name** and **section** can also be inferred from the file’s name:
`hello-world.1.md` will set `name` to `"hello-world"` and `section` to
`"1"`.

In addition, you can also provide inline configuration with a main heading:

```markdown
# hello-world(7) -- Two common words
```

...will set `name` to `"hello-world"`, `section` to `"7"`, and `description`
to `"Two common words"`.

The main heading has precedence over the file name, and the file name
over the plugin settings.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[travis-badge]: https://img.shields.io/travis/wooorm/remark-man.svg

[travis]: https://travis-ci.org/wooorm/remark-man

[codecov-badge]: https://img.shields.io/codecov/c/github/wooorm/remark-man.svg

[codecov]: https://codecov.io/github/wooorm/remark-man

[npm-install]: https://docs.npmjs.com/cli/install

[duo-install]: http://duojs.org/#getting-started

[releases]: https://github.com/wooorm/remark-man/releases

[license]: LICENSE

[author]: http://wooorm.com

[screenshot]: https://cdn.rawgit.com/wooorm/remark-man/master/screenshot.png
