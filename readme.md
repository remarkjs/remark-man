# mdast-man [![Build Status](https://img.shields.io/travis/wooorm/mdast-man.svg?style=flat)](https://travis-ci.org/wooorm/mdast-man) [![Coverage Status](https://img.shields.io/coveralls/wooorm/mdast-man.svg?style=flat)](https://coveralls.io/r/wooorm/mdast-man?branch=master)

**mdast-man** compiles markdown into man pages.  Great unicode support,
name, section, and description detection, nested block quotes and lists,
and more.

## Table of Contents

*   [Installation](#installation)

*   [Command line](#command-line)

*   [Programmatic](#programmatic)

    *   [mdast.use(man, options)](#mdastuseman-options)

*   [Configuration](#configuration)

*   [License](#license)

## Installation

[npm](https://docs.npmjs.com/cli/install):

```bash
npm install mdast-man
```

**mdast-man** is also available for [bower](http://bower.io/#install-packages),
[component](https://github.com/componentjs/component), [duo](http://duojs.org/#getting-started),
and for AMD, CommonJS, and globals ([uncompressed](mdast-man.js) and
[compressed](mdast-man.min.js)).

## Command line

![Example how mdast-man looks on screen](https://cdn.rawgit.com/wooorm/mdast-man/master/screen-shot.png)

Use mdast-man together with mdast:

```bash
npm install --global mdast mdast-man
```

Let’s say `example.md` looks as follows:

```md
# ls(1) -- list directory contents

## SYNOPSIS

`ls` \[`-ABCFGHLOPRSTUW@abcdefghiklmnopqrstuwx1`\] \[_file_ _..._\]
```

Then, to run **mdast-man** on `example.md`:

```bash
mdast -u mdast-man example.md -o
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

### [mdast](https://github.com/wooorm/mdast#api).[use](https://github.com/wooorm/mdast#mdastuseplugin-options)(man, options)

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

These to `mdast.use()` as a second argument, or on the CLI:

```bash
mdast --use 'man=name:"foo",section:2,description:"bar"' example.md
```

You can define these in `.mdastrc` or `package.json` [files](https://github.com/wooorm/mdast/blob/master/doc/mdastrc.5.md)
too. An example `.mdastrc` file could look as follows:

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

Where the object at `plugins.man` are the options for **mdast-man**.
The object at `settings` determines how **mdast** parses (and compiles)
markdown code.  Read more about the latter on [**mdast**’s readme](https://github.com/wooorm/mdast#mdastprocessvalue-options-done).

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
