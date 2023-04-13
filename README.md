**Note: The powertool specification is not final and is currently in heavy development.** Structures, libraries and file formats may change at any given time. This repository was created because some of our beta testers are interested in trying and testing the powertool APIs.

# Sample Powertool project
A powertool is a third party plugin which can extend Hollywood's functionality using a built-in hooking library. The powertool standard follows a [Deno-style permission system](https://deno.land/manual/getting_started/permissions), requiring the user to manually approve a powertool's access to more sensitive APIs (such as settings or the filesystem), meaning plugins don't get to access all information contained in Hollywood without the user's explicit consent.

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
| `settings` | `Schema[]` (optional) | Schematic-based settings in the same format as configurable script scripts and cloud settings. Defaults to `undefined`. |
| `libraries` | `string[]` (optional) | Libraries the powertool can request to import. Currently supported libraries are listed below. Defaults to `['base']`. |

**Supported libraries:** (as of August 24, 2022)
- `base`: _Included by default._ Base functions for interacting with the interface. Includes functions such as `hollywood.notification` to create notifications, or `hollywood.request` to make asynchronous web requests. This library is always imported even not included in `libraries.`
- `lua`: Functions for interacting with the Lua engine, namely `lua.send` and `lua.listen`. Read below for more dertails.
- `node`: Library for manipulating connected nodes and listening to their events. Read below for more details.
- `fs`: Synapse-like functions for interacting with the powertool's sandboxed filesystem, such as `hollywood.readFile` and `hollywood.writeFile`. FS access is limited to `/config/powertools/{powertool.id}` and there are rigorous checks to prevent accessing any other part of the filesystem.
- `settings`: Imports `hollywood.settings`, which allows the library to read settings using `hollywood.settings.get`.
- `settings-w`: When used in conjunction with `settings`, it imports `hollywood.settings.set`, which can update interface and core settings. **User permission must be granted before this library becomes usable.**

**Note**: More fields are supported, but are currently useless or irrelevant for third party powertools.

# Library
A powertool's execution environment comes with two default libraries: `hollywood` and `powertool`. These two offer relatively safe functions that any powertool can use to extend the functionality of the editor. Additional libraries requiring special permissions can be loaded too, as stated above. **Note:** wherever an 'icon' string is referenced, it refers to an [Iconify icon string](https://icon-sets.iconify.design/), which goes in the following format: `iconset-iconname`.

## **Hollywood APIs**
```ts
// Request to a webserver.
async hollywood.request(options: Request) => Promise<Response>;

interface Request {
    url: string,
    method?: string,
    headers?: Record<string, string>,
    cookies?: string,
    body?: string
}

interface Response {
    success: boolean,
    statusCode: number,
    statusMessage: string,
    headers: Record<string, string>,
    cookies: string,
    body: string
}
```
Asynchronously send a request to a remote webserver. The functionality of this API is almost the same as `syn.request` on the Lua side, except that it doesn't pass any of the special headers that Synapse usually attaches to the request.

```ts
hollywood.notification(type: 'information' | 'success' | 'warning' | 'error', title: string, description: string) => void;
```
Displays a notification in the UI. It's that simple.

## **Powertool APIs**
### **Page creation**
```ts
powertool.createPage(id: string, name: string, icon: string, element: preact.ComponentChild) => void;
```
This function creates a new page in the UI from the identifier, name, icon and [preact](https://preactjs.com/) component provided. A powertool can create as many pages, but once created, cannot be removed. **Read below for a list of available components.**
### **Toolbars**
```ts
// Create toolbar.
powertool.createToolbar(editor: Editor, toolbarId: string, toolbarEntries: ToolbarEntry[]) => void;

// Remove toolbar.
powertool.removeToolbar(editor: Editor, toolbarId: string) => void;

// Toolbar entry object.
interface ToolbarEntry {
    id: string;     // Identifier of button.
    icon: string;   // Icon of button.
    text: string;   // Tooltip that shows when hovering the button.
    callback: () => void; // Callback that executes when pressed.
}
```
Creates or removes a toolbar using the entries provided. A toolbar cannot be updated after creation, but can be removed and re-inserted when needed. The toolbar displays on top of the editor, like in this example:

![Example demonstrating toolbar use.](https://cdn.discordapp.com/attachments/1008559488804077639/1008812197696250019/unknown.png)

### **Nodes**
```ts
// Callback invoked when node connects.
node.onMount(callback: (node: number) => void) => void;

// Callback invoked when node disconnects.
node.onUnmount(callback: (node: number) => void) => void;

// Returns all connected nodes.
node.list() => number[];
```
`onMount` and `onUnmount` allows you to assign a single event callback for when a node connects or disconnects from the editor's server. **Only one callback may be assigned per powertool at a time**. If your powertool needs to retrieve all available nodes, it may arbitrarily call `list`. In powertool APIs, nodes are represented as numbers, and can be used as unique identifiers.

### **Lua**
```ts
// Listen to packets sent from Lua.
lua.listen(callback: (nodeId: number, receipt: object, reply?: Function) => void) => void;

// Send a packet to Lua from the powertool.
lua.send(nodeId: number, replyToken: string, data: string) => void;
```
`listen` can be used to listen to incoming Lua packets sent with `syn.ipc_send`. All serializable parameters passed to `syn.ipc_send` will be available in the `receipt` object, and if a `reply` field was included in the object, then the `reply` function in the callback will be defined, allowing you to quickly respond with any string-based value.

`send` can be used to send a packet to the Lua runtime that can be intercepted with a function stored in `getgenv()._reply` within a Lua script. Even though the global reply function is principally meant to listen to replies to packets sent through `syn.ipc_send`, the UI can invoke it at any time using the `send` API, passing a custom reply token as the second argument. If you want to send data anymore complex than a string, such as an object, then we recommend you serialize the data with JSON and deserialize it in the Lua runtime.

`node.list` and `lua.send` can be combined to send a single packet to all connected node. For example:
```js
for (const nodeId of node.list()) {
    lua.send(nodeId, 'incoming-token', 'Sent data goes here!');
}
```
## **Filesystem APIs**
**Note:** For this library to be enabled, you must specify the `fs` module in your plugin's configuration file. Your access to the filesystem is also sandboxed to your powertool's installation directory, and there is a size limit for written files. All files are read and written in `UTF-8` encoding.
```ts
// Reads a file and returns it. Errors if missing.
hollywood.readFile(filePath: string) => string;

// Writes or overwrites a file.
hollywood.writeFile(filePath: string, contents: string) => void;

// Appends a string to a file.
hollywood.appendFile(filePath: string, contents: string) => void;

// Lists all files and directories in the path provided.
hollywood.listFiles(dirPath: string) => string[];

// Returns whether the path is a file or a folder.
hollywood.isFile(somePath: string) => boolean;
hollywood.isFolder(somePath: string) => boolean;

// Creates a folder. Errors if it already exists.
hollywood.makeFolder(dirPath: string) => void;

// Deletes folder and its contents or a file. Errors if it doesn't exist.
hollywood.deleteFolder(dirPath: string) => void;
hollywood.deleteFile(filePath: string) => void;
```

## **Hooks**
Powertools can extend interface behavior using hooks, which are essentially event listeners that accept variables and content created or accessed by the software at specific points in time. They are the only way a powertool can gain semantically useful information and access to core libraries of the interface.

Hooks can be registered using the `powertool.registerHooks` API, which is already available in a powertool's execution environment without having to import/require any modules. The following hooks are available (all are optional in the object passed to `registerHooks`):
```ts
{
    tab: {
        /* Invoked when tab is saved. */
        onSave?: (tab: Tab) => void;
  
        /* Invoked when tab context menu is created (not displayed). */
        onContext?: (tab: Tab, context: ContextMenu) => void;
    },

    editor: {
        /* Invoked when tab is created. */
        onTabMount?: (tab: Tab) => void;

        /* Invoked when tab is unmounted. */
        onTabUnmount?: (tab: Tab) => void;

        /* Invoked when editor is created. */
        onCreate?: (editor: Editor) => void;
    },

    language: Array<
        {
            // Path to the language server's installation directory.
            readonly path: string;

            // Name of the language server.
            readonly name: string;

            // Auxiliary information (optional).
            readonly aux?: {
                uri: string;
                version: string;
                description: string;
            }

            // Path to application binaries, relative to .path.
            // Windows is obligatory, darwin/linux is optional.
            readonly binaries: {
                windows: string;
                darwin?: string;
                linux?: string;
            }
        }
    >;
}
```

We recommend looking at `index.js` to view an example of how hooks are installed from a powertool.

## **Importing data and Lua scripts**
Local assets relevant to your powertool may be obtained through their specialized `import` syntax. For instance, if you need to display an image in your powertool, can do this:
```ts
// Only jpg, jpeg, png, gif and svg formats are supported.

import myImage from './my-image.png'

function myComponent() {
    return <Components.SafeImage src={myImage}/>
}
```
### **Lua scripts**
Static Lua scripts packed alongside your powertool can be accessed and executed also through a specialized `import` syntax. If you have a script named `my-script.lua` in your powertool's installation directory, and you want to run it when a node mounts (imitating `autoexec` behavior), then you can do the following:
```ts
import runMyScript from './my-script.lua'

node.onMount(node => runMyScript(node))
```
A Lua script import returns a function that executes the script on any node passed. It cannot however pass any arguments or parameters to the script; if you want to do so, use the powertool communication interfaces.


## **Components**
Included in the powertool's environment is everything you need to build reactive interfaces with [preact](https://preactjs.com/), a minimal and lightweight alternative to React. There is no need to import anything as all hooks, components and related libraries are pre-included in the powertool. Components are styled depending on the user's chosen theme, so try not to make too much assumptions based on the layout or look of the interface if you are using custom styles.

- `Components.Button`  
Creates a button. Example usage:
```jsx
<Components.Button onClick={() => console.log('Hi!')}>
    Hello world!
</Components.Button>
```
- `Components.Checkbox`  
Creates a checkbox. **Children is not supported.** Example usage:  
```jsx
<Components.Checkbox caption="My checkbox" description="My description" value={false} onToggle={value => console.log(value)} />
```
- `Components.Dropdown`  
Creates a dropdown. The `selectIndex` property is used to indicate the current option chosen, and is zero-indexed. Example usage:
```jsx
<Components.Dropdown caption="My dropdown" description="My description" onIndex={(caption, index) => console.log(index)} selectIndex={0}>
    <Components.DropdownOption>
        Option 1
    </Components.DropdownOption>
    <Components.DropdownOption>
        Option 2
    </Components.DropdownOption>
    <Components.DropdownOption>
        Option 3
    </Components.DropdownOption>
</Components.Dropdown>
```
- `Components.Slider`  
Creates a slider. **Children is not supported.** Example usage:  
```jsx
<Components.Slider
    caption="My slider"
    description="My description"
    value={0}
    minimum={-100}
    maximum={100}
    step={2}
    onChange={(value) => console.log(value)}
/>
```
- `Components.TextBox`  
Creates a textbox. **Children is not supported.**  Example usage:  
```jsx
<Components.TextBox
    value="Current value of the textbox"
    placeholder="Transparent placeholder when there's no value"
    label="My textbox"
    description="My description"
    icon="An iconify-based icon"
    password={false}
    onChange={(value) => console.log(value)}
/>
```
- `Components.Tree`  
Creates a browsable list of nodes. Documentation pending. A tree is far more complex to create and display than any of the other components. Stay tuned.

- `Components.SafeImage`  
Creates a safely viewable image. **Children is not supported.**   Example usage:  
```jsx
<Components.SafeImage src='uri/to/image.png'/>
```

- `Components.Icon`  
Creates an icon. Example usage:  
```jsx
<Components.Icon icon='iconify-based-icon-here'/>
```

- `Components.Menu` and `Components.Page`  
Creates a navigable menu. Example usage:  
```jsx
powertool.createPage('example-page', 'Example Page', 'fluent:page-20-filled', 
    <Components.Menu>
        <Components.Page id="example" title="Example page" icon="fluent:weather-sunny-low-20-filled">
            <Components.Button>Hello world!</Components.Button>
        </Components.Page>
    </Components.Menu>
);
```

