import { JsonRpcInterface } from "./language-server/JsonRpcInterface.js"
import { WebsocketInterface } from "./websocket-interface/WebsocketInterface.js"

const DEFAULT_WS_PORT = 38378

const resolvePort = (portParam) => {
  if (portParam != null) {
    return portParam
  }
  if (process.env["websocket_text_relay_port"] != null) {
    return process.env["websocket_text_relay_port"]
  }
  return DEFAULT_WS_PORT
}

const fileProtocolPrefix = "file://"

const getNormalizedFileName = (uri) => {
  if (uri.startsWith(fileProtocolPrefix)) {
    return uri.substring(fileProtocolPrefix.length)
  }
  return uri
}

const lspInitializeResponse = {
  serverInfo: {
    name: "Websocket Text Relay LSP Server",
    version: "1.0.0",
  },
  capabilities: {
    textDocumentSync: 1, // full text sync
  },
}

export const startLanguageServer = (options = {}) => {
  const { inputStream: inputStreamParam, outputStream: outputStreamParam, port: portParam } = options
  const outputStream = outputStreamParam || process.stdout
  const inputStream = inputStreamParam || process.stdin

  const jsonRpc = new JsonRpcInterface({ inputStream, outputStream })

  const wsInterface = new WebsocketInterface({ port: resolvePort(portParam) })

  wsInterface.emitter.on("message", (message) => {
    if (message.method === "watch-editor-active-files") {
      jsonRpc.sendNotification("wtr/update-active-files", { files: message.files })
    }
  })

  jsonRpc.onRequest("initialize", (params) => {
    const wsInitMessage = {
      method: "init",
      name: params.clientInfo?.name || "Unnamed Editor",
      editorPid: params.processId,
      lsPid: process.pid,
    }

    const initOptions = params.initializationOptions || {}
    wsInterface.setAllowedHosts(initOptions.allowedHosts)
    wsInterface.setAllowNetworkAccess(initOptions.allowNetworkAccess)
    wsInterface.startInterface()
    wsInterface.sendInitMessage(wsInitMessage)

    return lspInitializeResponse
  })

  // use this function to hook into initalized event
  // jsonRpc.onNotification("initialized", () => {
  // })

  jsonRpc.onRequest("shutdown", () => {
    return null
  })

  jsonRpc.onNotification("exit", () => {
    process.exit(0)
  })

  jsonRpc.onNotification("wtr/update-open-files", ({ files }) => {
    wsInterface.sendOpenFileList(files)
  })

  jsonRpc.onNotification("textDocument/didOpen", (params) => {
    const file = getNormalizedFileName(params.textDocument.uri)
    const contents = params.textDocument.text
    wsInterface.sendText({ file, contents })
  })

  jsonRpc.onNotification("textDocument/didChange", (params) => {
    const file = getNormalizedFileName(params.textDocument.uri)
    const contents = params.contentChanges[0]?.text
    wsInterface.sendText({ file, contents })
  })
}
