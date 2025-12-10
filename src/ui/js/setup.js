import { WebsocketClient } from "./setup/WebsocketClient.js"
import { getEvalOnChangeFiles, clearEvalOnChangeFiles } from "./setup/evalOnChange.js" // initialize dependencies on the global __WTR__ object
import { setIsOnline, setSessions } from "./data/wtrStatus.js"
import { eventSubscriber } from "./setup/eventSubscriber.js" // make sure the eventSubscriber function is available on the __WTR__ object
import { emitActivity } from "./data/wtrActivity.js"

const FILE_PREFIX = "websocket-text-relay/src/ui/"
const WS_PORT = 38378
const { hostname, protocol } = window.location
const wsProtocol = protocol === "http:" ? "ws" : "wss"
const CSS_FILE = "css/main.css"
const cssEndsWith = FILE_PREFIX + CSS_FILE

const createJsEndsWith = (jsFile) => FILE_PREFIX + jsFile

const jsFiles = [
  "js/util/constants.js",
  "js/util/drawing.js",
  "js/components/headers.js",
  "js/components/footerStatus.js",
  "js/components/statusRing.js",
  "js/components/sessionWedges.js",
]

const ws = new WebsocketClient({ port: WS_PORT, host: hostname, protocol: wsProtocol })

const cssElement = document.getElementById("main_style")

const handleCss = (contents) => {
  cssElement.innerText = contents
}

const handleJs = (contents, jsEndsWith) => {
  // register and clean up event handlers on a per file basis
  window.__WTR__.onEvent = eventSubscriber(jsEndsWith)
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
  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      // wait for one frame to make sure css is applied first
      jsResults.forEach((contents, i) => {
        handleJs(contents, createJsEndsWith(jsFiles[i]))
      })
      resolve()
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
  setIsOnline(true)
  subscribeWatchers()
}
ws.emitter.on("socket-open", () => {
  setIsOnline(true)
  subscribeWatchers()
})

ws.emitter.on("socket-close", () => {
  setIsOnline(false)
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
  handleJs(message.contents, message.endsWith)
  const postEvalFiles = getEvalOnChangeFiles()
  const jsResults = await fetchAllFiles(postEvalFiles)
  jsResults.forEach((contents, i) => {
    handleJs(contents, createJsEndsWith(postEvalFiles, i))
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
    return
  }

  if (message.method === "watch-wtr-status") {
    setSessions(message.data?.sessions ?? [])
    return
  }

  if (message.method === "watch-wtr-activity") {
    emitActivity(message.data)
    return
  }
})
