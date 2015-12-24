# remark-man [![Build Status](https://img.shields.io/travis/wooorm/remark-man.svg)](https://travis-ci.org/wooorm/remark-man) [![Coverage Status](https://img.shields.io/codecov/c/github/wooorm/remark-man.svg)](https://codecov.io/github/wooorm/remark-man)

> :warning: **mdast is currently being renamed to remark** :warning:
> 
> This means all plug-ins and relating projects change too, causing many
> changes across the ecosystem. Expect the dust to settle in roughly a day.
> 
> See this project at the previous stable commit
> [c4a51d1](https://github.com/wooorm/remark-github/commit/c4a51d1).

**remark-man** compiles markdown into man pages.  Great unicode support,
name, section, and description detection, nested block quotes and lists,
tables, and more.

## Table of Contents

*   [Installation](#installation)

*   [Command line](#command-line)

*   [Programmatic](#programmatic)

    *   [remark.use(man, options)](#remarkuseman-options)

*   [Configuration](#configuration)

*   [License](#license)

## Installation

[npm](https://docs.npmjs.com/cli/install):

```bash
npm install remark-man
```

**remark-man** is also available for [bower](http://bower.io/#install-packages),
[component](https://github.com/componentjs/component), [duo](http://duojs.org/#getting-started),
and for AMD, CommonJS, and globals ([uncompressed](remark-man.js) and
[compressed](remark-man.min.js)).

## Command line

![Example how remark-man looks on screen](https://cdn.rawgit.com/wooorm/remark-man/master/screen-shot.png)

Use remark-man together with remark:

```bash
npm install --global remark remark-man
```

Let’s say `example.md` looks as follows:

```md
# ls(1) -- list directory contents

## SYNOPSIS

`ls` \[`-ABCFGHLOPRSTUW@abcdefghiklmnopqrstuwx1`\] \[_file_ _..._\]
```

Then, to run **remark-man** on `example.md`:

```bash
remark -u remark-man example.md -o
#
# Yields (check out the newly created `example.1` file):
#
# .TH "LS" "1" "June 2015" "" ""
# .SH "NAME"
# \fBls\fR - list directory contents
# .SH "SYNOPSIS"
# .P
# \fBls\fR \[lB]\fB-ABCFGHLOPRSTUW\[at]abcdefghiklmnopqrstuwx1\fR\[rB] \[lB]\fIfile\fR \fI...\fR\[rB]
#
```

Now, that looks horrible, but that’s how roff/groff/troff are :wink:.

To properly view that man page, use something like this: `man ./example.1`.

## Programmatic

### [remark](https://github.com/wooorm/remark#api).[use](https://github.com/wooorm/remark#remarkuseplugin-options)(man, options)

**Parameters**

*   `man` — This plugin;
*   `options` (`Object?`) — See below.

## Configuration

All options, including the `option` object itself, are optional:

*   `name` (`string`);

*   `section` (`number` or `string`);

*   `description` (`string`);

*   `date` (given to `new Date()`);

*   `version` (`string`);

*   `manual` (`string`);

*   `slug` ([`*`](https://github.com/wooorm/remark-slug#remarkuseslug-options))
    — Passed to [remark-slug](https://github.com/wooorm/remark-slug), used for
    anchor-link detection.

Pass these to `remark.use()` as a second argument, or on the CLI:

```bash
remark --use 'man=name:"foo",section:2,description:"bar"' example.md
```

You can define these in `.remarkrc` or `package.json` [files](https://github.com/wooorm/remark/blob/master/doc/remarkrc.5.md)
too. An example `.remarkrc` file could look as follows:

```json
{
  "plugins": {
    "man": {
        "manual": "Phonetic Alphabet",
        "version": "0.1.0",
        "date": "2015-06-01"
    }
  },
  "settings": {
    "commonmark": true
  }
}
```

Where the object at `plugins.man` are the options for **remark-man**.
The object at `settings` determines how **remark** parses (and compiles)
markdown code.  Read more about the latter on [**remark**’s readme](https://github.com/wooorm/remark#remarkprocessvalue-options-done).

The **name** and **section** can also be inferred from the file’s name:
`hello-world.1.md` will set `name` to `"hello-world"` and `section` to `"1"`.

In addition, you can also provide inline configuration with a main heading:

```markdown
# hello-world(7) -- Two common words
```

...will set `name` to `"hello-world"`, `section` to `"7"`, and `description`
to `"Two common words"`.

The main heading overwrites the file name, and the file name the plugin
settings.

## License

[MIT](LICENSE) © [Titus Wormer](http://wooorm.com)
