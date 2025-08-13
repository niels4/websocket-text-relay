import { EventEmitter } from "node:events"
import { getNextId } from "./util.js"
import {
  startSessionStatus,
  endSessionStatus,
  statusEvents,
  removeWatchedFileLinks,
} from "./sessionManager.js"

export class WtrSession {
  constructor({ apiMethods, wsConnection, wsInterfaceEmitter }) {
    this.apiMethods = apiMethods
    this.wsConnection = wsConnection
    this.wsInterfaceEmitter = wsInterfaceEmitter
    this.id = getNextId()
    this.emitter = new EventEmitter()
    this.watchedFiles = new Set()
    this.openFiles = new Set()
    this.activeOpenFiles = new Map()

    this.watchActiveFiles = false
    this.watchLogMessages = false
    this.watchWtrActivity = false
    this.watchWtrStatus = false

    this._subscribeToEvents()
    startSessionStatus(this)
  }

  sendMessageToClient(message) {
    if (this.wsConnection) {
      this.wsConnection.send(JSON.stringify(message))
    } else {
      this.wsInterfaceEmitter.emit("message", message)
    }
  }

  isServer() {
    return this.wsInterfaceEmitter != null
  }

  _subscribeToEvents = () => {
    this.emitter.on("log", this._onLog.bind(this))
    this.emitter.on("editor-active-files-update", this._onEditorActiveFilesUpdate.bind(this))

    this._onActivityUpdate = this._onActivityUpdate.bind(this)
    statusEvents.on("activity-update", this._onActivityUpdate)
    this._onStatusUpdate = this._onStatusUpdate.bind(this)
    statusEvents.on("status-update", this._onStatusUpdate)

    if (this.wsConnection) {
      this._onWsMessage = this._onWsMessage.bind(this)
      this._onWsClose = this._onWsClose.bind(this)
      this.wsConnection.on("message", this._onWsMessage)
      this.wsConnection.on("close", this._onWsClose)
      this.wsConnection.on("error", this._onWsClose)
    }
  }

  _onWsClose() {
    if (this.wsConnection) {
      this.wsConnection.removeListener("message", this._onWsMessage)
      this.wsConnection.removeListener("close", this._onWsClose)
      this.wsConnection.removeListener("error", this._onWsClose)
    }

    statusEvents.removeListener("activity-update", this._onEditorActiveFilesUpdate)
    statusEvents.removeListener("status-update", this._onStatusUpdate)

    endSessionStatus(this)
    for (const endsWith of this.watchedFiles) {
      removeWatchedFileLinks(this, endsWith)
    }

    this.emitter.removeAllListeners()
  }

  _onLog(data) {
    if (!this.watchLogMessages) {
      return
    }
    this.sendMessageToClient({ method: "watch-log-messages", data })
  }

  _onEditorActiveFilesUpdate(files) {
    if (!this.watchActiveFiles) {
      return
    }
    this.sendMessageToClient({ method: "watch-editor-active-files", files })
  }

  _onActivityUpdate(data) {
    if (!this.watchWtrActivity) {
      return
    }
    this.sendMessageToClient({ method: "watch-wtr-activity", data })
  }

  _onStatusUpdate(data) {
    if (!this.watchWtrStatus) {
      return
    }
    this.sendMessageToClient({ method: "watch-wtr-status", data })
  }

  _onWsMessage(dataBuf) {
    const str = dataBuf.toString()
    let message

    try {
      message = JSON.parse(str)
    } catch {
      this.emitter.emit("log", { level: "error", text: `Could not parse JSON message: ${str}` })
      return
    }

    this._handleApiMessage(message)
  }

  _handleApiMessage(message) {
    const method = message && message.method
    const methodHandler = this.apiMethods.get(method)
    if (!methodHandler) {
      this.emitter.emit("log", { level: "error", text: `unknown ws api method: ${method}` })
      return
    }

    try {
      methodHandler(this, message)
    } catch (e) {
      this.emitter.emit("log", {
        level: "error",
        text: `Error while handling method: ${method} : ${e.stacktrace}`,
      })
      console.error("Error while handling ws api method", method, e)
    }
  }
}
