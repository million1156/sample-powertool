**Note: The powertool specification is not final and is currently in heavy development.** Structures, libraries and file formats may change at any given time. This repository was created because some of our beta testers are interested in trying and testing the powertool APIs.

# Sample Powertool project
A powertool is a third party plugin which can extend [Hollywood](https://github.com/synllc/hollywood)'s functionality using a built-in hooking library. The powertool standard follows a [Deno-style permission system](https://deno.land/manual/getting_started/permissions), requiring the user to manually approve a powertool's access to more sensitive APIs (such as settings or the filesystem), meaning plugins don't get to access all information contained in Hollywood without the user's explicit consent.

**Powertools are ran in a heavily sandboxed, restricted environment.** Only a tiny subset of standard JavaScript functions are imported into the environment by default, with extra functions and libraries requiring user consent to be imported.

## Enabling powertools
**By default, third party powertools are not enabled in Hollywood.** This is for safety purposes as third party powertools, even if sandboxed, increase the attack surface of the utility by a wide margin. Additionally, the API exposed to the environment isn't perfected yet and may currently have issues that lead to escapes. In order to use third party tools, you will have to explicitly enable them through flags.

To create a Hollywood flag file, you have to create `flags.json` in the root directory of your installation if it doesn't already exist. The flag file contains a single object mapping flag names to their values, but in our case, we simply have to map the flag `enableThirdPartyPowertools` to `true`, like this:
```json
{ "enableThirdPartyPowertools": true }
```

When this flag is enabled, Hollywood will display a notice on every launch telling the user that third party powertools are enabled and listing the currently installed powertools. It also recommends the user to disable third party powertools by pressing "No" if he doesn't know what they are or if he didn't enable powertools himself. For safety purposes, there isn't a mechanism to disable this notice.

## Installing a powertool
Powertools can be installed by extracting it into a folder within the `/plugins` directory in the root of your Hollywood installation (or in `/userconf/plugins` if running Hollywood via the commandline). Contrary to built-in powertools, locally installed powertools cannot be managed from the interface, meaning installation, uninstallation and updates must be done manually by the user. The name of the folder into which you extract your powertool is meaningless as the ID of the powertool is defined within its `plugin.toml` file.

## Creating a powertool
Creating a powertool is a relatively easy process for any JavaScript developer.

### `plugin.toml`
**Every powertool must come with a `plugin.toml` description file in its root.** This file describes the plugin, gives it a name, id and description, and defines any libraries that it wishes to import. For accessibility, the file uses the [TOML](https://github.com/toml-lang/toml) file format instead of classic json.
#### Structure
| Field | Type | Description |
|-|-|-|
| `id` | `string` | This is the identifier used to represent the powertool. |
| `name` | `string` | Human-readable name of powertool. Make sure it's not anything too arcane. |
| `description` | `string` | This should describe what the powertool does in a preferably short sentence. |
| `settings` | `Schema[]` (optional) | Schematic-based settings in the same format as configurable script scripts and cloud settings. The format can be viewed in Hollywood's [source code](https://github.com/synllc/hollywood/blob/main/src/settings.ts). Defaults to `undefined`. |
| `libraries` | `string[]` (optional) | Libraries the powertool can request to import. Currently supported libraries are `base`, `fs`, `settings` and `settings-w`. Defaults to `['base']`. |

**Supported libraries:** (as of June 27, 2022)
- `base`: _Included by default._ Base functions for interacting with the interface. Includes functions such as `hollywood.notification` to create notifications, or `hollywood.request` to make asynchronous web requests. This library is always imported even not included in `libraries.`
- `fs`: Synapse-like functions for interacting with the powertool's sandboxed filesystem, such as `hollywood.readFile` and `hollywood.writeFile`. FS access is limited to `/config/powertools/{powertool.id}` and there are rigorous checks to prevent accessing any other part of the filesystem.
- `settings`: Imports `hollywood.settings`, which allows the library to read settings using `hollywood.settings.get`.
- `settings-w`: When used in conjunction with `settings`, it imports `hollywood.settings.set`, which can update interface and core settings. **User permission must be granted before this library becomes usable.**

**Note**: More fields are supported, but are currently useless or irrelevant for third party powertools.

### Hooks
Powertools can extend interface behavior using hooks, which are essentially event listeners that accept variables and content created or accessed by the software at specific points in time. They are the only way a powertool can gain semantically useful information and access to core libraries of the interface. The list of hooks currently supported by Hollywood can be found in its [respective source file](https://github.com/synllc/hollywood/blob/main/src/renderer/hooks.ts), but this sample project should showcase the most useful ones.

We recommend looking at `index.js` to view an example of how hooks are installed from a powertool.
