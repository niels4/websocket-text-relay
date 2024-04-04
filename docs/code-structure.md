# Developer Guide: Code Structure

## Core Logic: the start function
_websocket-text-relay_ merges two asynchronous interfaces. The the LSP server <-> text editor interface and
the websocket server <-> front end client interface.

Everything starts with the `startLanguageServer` function exported by the index.js file in the root of the project. The start function
is exported this way so it can be used as either a standalone command line application (the way the Neovim plugin interacts with the LSP server)
or as an imported library (the way the VSCode extension uses websocket-text-relay).

The function takes as parameters the input and output streams for the LSP server (they are optional and default to stdin and stdout if not included), and the port
for the http/websocket server (optional and defaults to 38378).

This function will connect the LSP server to the IO streams and spin up the websocket interface on the resolved port. Then it will wire up all
of the LSP lifecycle events and websocket API events to their handlers.

Every text editor instance will start up an instance of the websocket-text-relay app. Because it needs to host
an http server on a specific port for front end clients to connect to, only one instance of the app may act as the
websocket server. Every subsuquent instance must connect to that websocket server as a client to relay its text changes.
This is all abstracted away behind the websocket-interface, which is explained in greater detail below.

## Core Logic: The lsp and websocket events

LSP: `initailze` / WS: `init`

Whenever a new editor instance or front end client connects to the websocket, a websocket session is created for that client. These
can be seen as the labeled blue wedges around the ring in the status UI. When the lsp client from the editor sends an
initialize request to the language-server, it contains the editor name and editor processId. This data is then sent to the
main websocket server in an `init` message, where it can be viewed in the status UI (used to determine which sessions are editors and label each wedge with the editor name)

WS: `watch-file`

The front end client will send `watch-file` events to the websocket server to let it know what file changes it wants to subscribe to.

LSP: `wtr/update-open-files`

This event has to be manually sent by the editor plugin. Any time a file is opened or closed in the editor, the editor
will send a list of open files to the language-server.

LSP: `wtr/update-active-files`

The sessionManager will reconcile the files that the front end clients are watching with the files that the text
editor has open and determine which files the LSP client should attach to. Once attached the client will start sending `textDocument/didChange` events.

LSP: `textDocument/didChange`

Whenever an active text document is updated, send the latest changes to all watching clients via the weboscket-interface


## Language-Server

The language-server directory contains the code that handles communicating with the text editor over stdio. The main export for
interfacing with the LSP events is the JsonRpcInterface object in the JsonRpcInterface.js file. JsonRpc has 2
message types, requests and notifications. Therefore the JsonRpcInterface has 4 functions to send and receive these message types.

    * onRequest - handle incoming requests from editor. Can be asynchronous, return a promise, or return a response synchronously.
    * onNotification - handle incoming notifications from editor. No return value
    * sendRequest - send outgoing request to editor. Returns a promise that resolves with the editor's response
    * sendNotification - send outgoing notification. No response or return value

The code in LspReader and LspWriter handles all the lower level details of reading and writing JSON RPC messages. Test
driven development (TDD) was used to develop the data stream handlers and verify that the resulting interface behaves
as expected.

## Websocket-Interface

The websocket-interface directory contains the code for hosting and interacting with the websocket API. When the
application first starts up, the websocket-interface will attempt to spin up the http server on the specified port. If
successful, the application runs in server mode and all function calls made to the websocket-interface will be directed to itself.
If there is already a server running on the specified port, then the interface will connect to that server as a client. All
calls made through the websocket-interface will now be sent to the main websocket instance through the websocket client.

If the main server ever goes offline, each instance will attempt to start up an http server on the port. The first instance able
to start the http server will be the new main server, the rest of the instances will receive a port in use error from the OS and then
proceed to connect to the new server in client mode again.

All init messages are resent when a websocket client reconnects.
