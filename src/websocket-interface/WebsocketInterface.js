import { WebsocketClient } from "./WebsocketClient.js"
import { WtrSession } from "./WtrSession.js"
import { apiMethods } from "./websocketApi.js"
import { createWebsocketServer } from "./websocketServer.js"
import {EventEmitter} from 'node:events'

const watchActiveFilesMessage = { method: "watch-editor-active-files" }

export class WebsocketInterface {
  constructor ({port}) {
    this.port = port
    this.emitter = new EventEmitter() // emits "message" events from the server
    this.initMessage = null
    this.openFileListMessage = null
    this.serverSession = null
    this.wsClient = null

    this._onSocketClose = this._onSocketClose.bind(this)
    this._sendQueuedMessages = this._sendQueuedMessages.bind(this)
  }

  sendInitMessage (initMessage) {
    this.initMessage = initMessage
    this._sendMessageToServer(initMessage)
  }

  sendOpenFileList (files) {
    this.openFileListMessage = {method: "update-open-files", files}
    this._sendMessageToServer(this.openFileListMessage)
  }

  sendText ({file, contents}) {
    const sendTextMessage = {method: "relay-text", file, contents}
    this._sendMessageToServer(sendTextMessage)
  }

  setAllowedHosts (allowedHostsList) {
    this.allowedHosts = new Set(allowedHostsList)
  }

  async startInterface () {
    try {
      await createWebsocketServer(this.port, this.allowedHosts)
      this.serverSession = new WtrSession({apiMethods, wsInterfaceEmitter: this.emitter})
      this._sendQueuedMessages()
    } catch (e) {
      this.wsClient = new WebsocketClient({port: this.port, wsInterfaceEmitter: this.emitter})
      this.wsClient.socket.on('close', this._onSocketClose)
      this.wsClient.socket.on('open', this._sendQueuedMessages)
    }
  }

  _onSocketClose () {
    this.wsClient.socket.removeEventListener("close", this._onSocketClose)
    this.wsClient.socket.removeEventListener("open", this._sendQueuedMessages)
    this.wsClient = null
    this.startInterface()
  }

  _sendQueuedMessages () {
    this._sendMessageToServer(watchActiveFilesMessage)
    if (this.initMessage) { this._sendMessageToServer(this.initMessage) }
    if (this.openFileListMessage) { this._sendMessageToServer(this.openFileListMessage) }
  }

  _sendMessageToServer (message) {
    if (this.serverSession) {
      this.serverSession._handleApiMessage(message)
    } else if (this.wsClient && this.wsClient.socketOpen){
      this.wsClient.sendMessage(message)
    }
  }
}
