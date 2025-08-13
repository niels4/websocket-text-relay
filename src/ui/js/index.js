import { WebsocketClient } from "./util/WebsocketClient.js"
import "./util/DependencyManager.js"

const { cleanupEventHandlers, statusDataEmitter } = window.__WTR__

const FILE_PREFIX = "websocket-text-relay/src/ui/"
const CSS_FILE = "css/main.css"
const cssEndsWith = FILE_PREFIX + CSS_FILE

const MAIN_JS_FILE = "js/main.js"
const mainJsEndsWith = FILE_PREFIX + MAIN_JS_FILE

const jsFiles = [
  "js/util/constants.js",
  "js/util/drawing.js",
  "js/components/grids.js",
  "js/components/HeaderSummary.js",
  "js/components/StatusRing.js",
  "js/components/SessionWedges.js",
  "js/components/SessionLabels.js",
  "js/components/ActivityTimeseriesGraph.js",
  "js/components/ServerStatus.js",
  MAIN_JS_FILE,
]

const svgRoot = document.getElementById("svg_root")
const cssElement = document.getElementById("main_style")

const { hostname, port, protocol } = window.location
const wsProtocol = protocol === "http:" ? "ws" : "wss"
const ws = new WebsocketClient({ port: port, host: hostname, protocol: wsProtocol })

const handleCss = (contents) => {
  cssElement.innerText = contents
}

let lastMainContents = null
let initFinished = false
const handleJs = (contents) => {
  try {
    eval(contents)
  } catch (e) {
    window._lastEvalError = e
    console.log(e)
  }
}

ws.emitter.on("message", (message) => {
  console.log("got emitter message", message)
  if (message.endsWith === cssEndsWith) {
    handleCss(message.contents)
    return
  }
  if (message.method === "watch-file" && message.endsWith.endsWith(".js")) {
    if (!initFinished) {
      return
    }
    cleanupEventHandlers()
    handleJs(message.contents)
    if (message.endsWith === mainJsEndsWith) {
      lastMainContents = message.contents
    } else if (lastMainContents != null) {
      handleJs(lastMainContents)
    }
    return
  }
  if (message.method === "watch-wtr-status") {
    statusDataEmitter.emit("data", message.data)
    return
  }
  if (message.method === "watch-wtr-activity") {
    statusDataEmitter.emit("activity", message.data)
    return
  }
})

ws.emitter.on("socket-open", () => statusDataEmitter.emit("socket-open"))
ws.emitter.on("socket-close", () => statusDataEmitter.emit("socket-close"))

const initFiles = async () => {
  await fetch(CSS_FILE)
    .then((r) => r.text())
    .then(handleCss)
  const jsFetches = jsFiles.map(async (fileName) => {
    return fetch(fileName).then((r) => r.text())
  })
  const jsResults = await Promise.all(jsFetches)
  lastMainContents = jsResults.at(-1)
  requestAnimationFrame(() => {
    // make sure css is  applied first
    jsResults.forEach((contents) => {
      handleJs(contents)
    })
    initFinished = true
  })
}

const subscribeWatchers = () => {
  ws.sendMessage({ method: "watch-log-messages" })
  ws.sendMessage({ method: "watch-wtr-status" })
  ws.sendMessage({ method: "watch-wtr-activity" })
  ws.sendMessage({ method: "init", name: "status-ui" })
  ws.sendMessage({ method: "watch-file", endsWith: cssEndsWith })
  jsFiles.forEach((jsFile) => {
    const jsEndsWith = FILE_PREFIX + jsFile
    ws.sendMessage({ method: "watch-file", endsWith: jsEndsWith })
  })
}

await initFiles()
subscribeWatchers()

const updateSvgDimensions = () => {
  svgRoot.setAttribute("height", window.innerHeight - 4)
  svgRoot.setAttribute("width", window.innerWidth)
}

updateSvgDimensions()
window.addEventListener("resize", () => {
  updateSvgDimensions()
})
