import { WebsocketClient } from "./util/WebsocketClient.js"
import { getEvalOnChangeFiles, clearEvalOnChangeFiles } from "./dependencies.js" // initialize dependencies on the global __WTR__ object

const FILE_PREFIX = "websocket-text-relay/src/ui/"
const WS_PORT = 38378
const { hostname, protocol } = window.location
const wsProtocol = protocol === "http:" ? "ws" : "wss"
const CSS_FILE = "css/main.css"
const cssEndsWith = FILE_PREFIX + CSS_FILE

const jsFiles = ["js/util/constants.js", "js/util/drawing.js", "js/components/statusRing.js"]

const ws = new WebsocketClient({ port: WS_PORT, host: hostname, protocol: wsProtocol })

const cssElement = document.getElementById("main_style")

const handleCss = (contents) => {
  cssElement.innerText = contents
}

const handleJs = (contents) => {
  try {
    eval(contents)
  } catch (e) {
    window._lastEvalError = e
    console.log(e)
  }
}

const fetchAllFiles = async (fileNames) => {
  const fetches = fileNames.map(async (fileName) => {
    return fetch(fileName).then((r) => r.text())
  })
  return Promise.all(fetches)
}

const initFiles = async () => {
  await fetch(CSS_FILE)
    .then((r) => r.text())
    .then(handleCss)
  const jsResults = await fetchAllFiles(jsFiles)
  requestAnimationFrame(() => {
    // wait for one frame to make sure css is applied first
    jsResults.forEach((contents) => {
      handleJs(contents)
    })
  })
}
await initFiles()

const subscribeWatchers = () => {
  ws.sendMessage({ method: "watch-log-messages" })
  ws.sendMessage({ method: "watch-wtr-status" })
  ws.sendMessage({ method: "watch-wtr-activity" })
  ws.sendMessage({ method: "init", name: "WTR Status" })
  ws.sendMessage({ method: "watch-file", endsWith: cssEndsWith })
  jsFiles.forEach((jsFile) => {
    const jsEndsWith = FILE_PREFIX + jsFile
    ws.sendMessage({ method: "watch-file", endsWith: jsEndsWith })
  })
}

if (ws.socketOpen) {
  subscribeWatchers()
}
ws.emitter.on("socket-open", () => {
  subscribeWatchers()
})

let evalInProgress = false
let bufferedMessage = null
const handleJsMessage = async (message) => {
  if (evalInProgress) {
    bufferedMessage = message
    return
  }
  evalInProgress = true
  clearEvalOnChangeFiles()
  handleJs(message.contents)
  const jsResults = await fetchAllFiles(getEvalOnChangeFiles())
  jsResults.forEach((contents) => {
    handleJs(contents)
  })
  evalInProgress = false
  if (bufferedMessage) {
    const outstandingMessage = bufferedMessage
    bufferedMessage = null
    handleJsMessage(outstandingMessage)
  }
  return
}
ws.emitter.on("message", async (message) => {
  if (message.method === "watch-file" && message.endsWith === cssEndsWith) {
    handleCss(message.contents)
    return
  }

  if (message.method === "watch-file" && message.endsWith.endsWith(".js")) {
    await handleJsMessage(message)
  }

  if (message.method === "watch-wtr-status") {
    console.log("watch status message", message.data)
    return
  }
  if (message.method === "watch-wtr-activity") {
    console.log("watch activity message", message.data)
    return
  }
})
