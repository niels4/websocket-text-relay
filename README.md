# websocket-text-relay (WTR)

This application connects to your text editor using the Language Server Protocol (LSP) and then starts a websocket
server that front end clients can connect to and subscribe to file change events. This allows users to see their
front end changes evaluated immediately as they type, without having to first save the file to disk or reload the browser.

## Usage

### 1. Install the extension for your text editor

WTR currently has plugins for Neovim and VSCode.
    * Installation instructions for Neovim
    * Installation instructions for VSCode

If you wish to create a plugin for a new editor, the process is fairly straight forward if the editor has
LSP support. See the [developer guide to creating a WTR text editor plugin](./docs/creating-text-editor-plugin.md)

### 2. Connect to the websocket server from the front end application

To use this on a professional level project that gives you the option to use modules, typescript, and react, I recommend using vite along with
the plugin **vite-plugin-websocket-text-relay**. This plugin gives you all the power of vite when developing while also hooking
the live text updates into Vite's hot module reload system.

If you want to use this as a learning tool to play around with UI concepts using simple projects involving 1 html, css, and javascript file,
then check out this **Simple WTR reference project**. This is a great setup for following along with any short and focused web development tutorials.

And finally, the [status UI for this project](http://localhost:38378) was also created using live updates from websocket-text-relay.
In addition to giving you live feedback on the status and activity of the application, it is also meant to serve as a
reference UI project that is more complicated than a single javascript file, but still doesn't use any external dependencies.


## Developing

If you are a developer looking to run websocket-text-relay from source and make modifications, follow the [Developer Getting Started Guide](./docs/dev-getting-started.md)
