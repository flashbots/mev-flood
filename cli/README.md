oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![GitHub license](https://img.shields.io/github/license/oclif/hello-world)](https://github.com/oclif/hello-world/blob/main/LICENSE)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g mevflood
$ mevflood COMMAND
running command...
$ mevflood (--version)
mevflood/0.0.0 darwin-x64 node-v16.16.0
$ mevflood --help [COMMAND]
USAGE
  $ mevflood COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`mevflood hello PERSON`](#mevflood-hello-person)
* [`mevflood hello world`](#mevflood-hello-world)
* [`mevflood help [COMMANDS]`](#mevflood-help-commands)
* [`mevflood plugins`](#mevflood-plugins)
* [`mevflood plugins:install PLUGIN...`](#mevflood-pluginsinstall-plugin)
* [`mevflood plugins:inspect PLUGIN...`](#mevflood-pluginsinspect-plugin)
* [`mevflood plugins:install PLUGIN...`](#mevflood-pluginsinstall-plugin-1)
* [`mevflood plugins:link PLUGIN`](#mevflood-pluginslink-plugin)
* [`mevflood plugins:uninstall PLUGIN...`](#mevflood-pluginsuninstall-plugin)
* [`mevflood plugins:uninstall PLUGIN...`](#mevflood-pluginsuninstall-plugin-1)
* [`mevflood plugins:uninstall PLUGIN...`](#mevflood-pluginsuninstall-plugin-2)
* [`mevflood plugins update`](#mevflood-plugins-update)

## `mevflood hello PERSON`

Say hello

```
USAGE
  $ mevflood hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [dist/commands/hello/index.ts](https://github.com/flashbots/mev-flood/blob/v0.0.0/dist/commands/hello/index.ts)_

## `mevflood hello world`

Say hello world

```
USAGE
  $ mevflood hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ mevflood hello world
  hello world! (./src/commands/hello/world.ts)
```

## `mevflood help [COMMANDS]`

Display help for mevflood.

```
USAGE
  $ mevflood help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for mevflood.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.9/src/commands/help.ts)_

## `mevflood plugins`

List installed plugins.

```
USAGE
  $ mevflood plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ mevflood plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.4.7/src/commands/plugins/index.ts)_

## `mevflood plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ mevflood plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ mevflood plugins add

EXAMPLES
  $ mevflood plugins:install myplugin 

  $ mevflood plugins:install https://github.com/someuser/someplugin

  $ mevflood plugins:install someuser/someplugin
```

## `mevflood plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ mevflood plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ mevflood plugins:inspect myplugin
```

## `mevflood plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ mevflood plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ mevflood plugins add

EXAMPLES
  $ mevflood plugins:install myplugin 

  $ mevflood plugins:install https://github.com/someuser/someplugin

  $ mevflood plugins:install someuser/someplugin
```

## `mevflood plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ mevflood plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ mevflood plugins:link myplugin
```

## `mevflood plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ mevflood plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ mevflood plugins unlink
  $ mevflood plugins remove
```

## `mevflood plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ mevflood plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ mevflood plugins unlink
  $ mevflood plugins remove
```

## `mevflood plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ mevflood plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ mevflood plugins unlink
  $ mevflood plugins remove
```

## `mevflood plugins update`

Update installed plugins.

```
USAGE
  $ mevflood plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
