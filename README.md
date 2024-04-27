# websocket-text-relay (WTR)

This application connects to your text editor using the Language Server Protocol (LSP) and then starts a websocket
server that front end clients can connect to and subscribe to file change events. This allows users to see their
front end changes evaluated immediately as they type, without having to first save the file to disk or reload the browser.
It's a similar concept to sites like CodePen and JsFiddle, except you can develop locally using your own text editor with all
of your personalized plugins instead of having to use an in browser code editor.

## Usage

### 1. Install the extension for your text editor

WTR currently has plugins for Neovim and VSCode.
 - [websocket-text-relay.nvim](https://github.com/niels4/websocket-text-relay.nvim)
 - [websocket-text-relay-vscode](https://github.com/niels4/websocket-text-relay-vscode)

### 2. Verify the webserver is running with the status UI

The websocket server hosts its own status UI on the same port as the websocket server. You can view
the status UI and verify everything is running by first starting up your text editor and then opening your browser to [http://localhost:38378](http://localhost:38378)

### 3. Connect to the websocket server from the front end application

To use this on a professional level project that gives you the option to use modules, typescript, and react, I recommend using vite along with
the plugin [vite-plugin-websocket-text-relay](https://github.com/niels4/vite-plugin-websocket-text-relay). This plugin gives you all the power of vite when developing while also hooking
the live text updates into Vite's hot module reload system.

If you want to use this as a learning tool to play around with UI concepts using simple projects involving 1 html, css, and javascript file,
then check out this [simple reference project](https://github.com/niels4/wtr-simple-example). This is a great setup for following along with any short and focused web development tutorials.

And finally, the status UI for this project was also created using live updates from websocket-text-relay.
In addition to giving you live feedback on the status and activity of the application, it is also meant to serve as a
reference UI project that is more complicated than a single javascript file, but still doesn't use any external dependencies.

## Developing

If you are a developer looking to run websocket-text-relay from source and make modifications, follow the [Developer Getting Started Guide](./docs/dev-getting-started.md)
