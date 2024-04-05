import { EventEmitter } from './EventEmitter.js'

const RECONNECT_DELAY_SECONDS = 1

export class WebsocketClient {
  constructor ({port, host = "localhost", protocol = "ws"}) {
    this.port = port
    this.host = host
    this.protocol = protocol
    this.emitter = new EventEmitter()
    this.sessionMessages = []
    this.socket = null
    this.socketOpen = false

    this._onSocketOpen = this.onSocketOpen.bind(this)
    this._onSocketMessage = this.onSocketMessage.bind(this)
    this._onSocketError = this.onSocketError.bind(this)
    this._onSocketClose = this.onSocketClose.bind(this)

    this.startClient()
  }

  getUrl () {
    return `${this.protocol}://${this.host}:${this.port}`
  }

  startClient () {
    this.socket = new WebSocket(this.getUrl())
    this.socket.addEventListener('open', this._onSocketOpen)
    this.socket.addEventListener('message', this._onSocketMessage)
    this.socket.addEventListener('error', this._onSocketError)
    this.socket.addEventListener('close', this._onSocketClose)
  }

  onSocketOpen () {
    console.log("websocket client connected")
    this.socketOpen = true
    this.emitter.emit("socket-open")
    this.sessionMessages.forEach(msgStr => this.socket.send(msgStr))
  }

  onSocketClose () {
    console.log(`websocket text relay connection closed. Retrying connection in ${RECONNECT_DELAY_SECONDS} second${RECONNECT_DELAY_SECONDS === 1 ? "" : "s"}...`)
    if (this.socket == null) { return }
    this.emitter.emit("socket-close")
    this.socketOpen = false
    this.socket.removeEventListener('open', this._onSocketOpen)
    this.socket.removeEventListener('message', this._onSocketMessage)
    this.socket.removeEventListener('error', this._onSocketError)
    this.socket.removeEventListener('close', this._onSocketClose)
    this.socket = null
    setTimeout(() => this.startClient(), RECONNECT_DELAY_SECONDS * 1000)
  }

  onSocketMessage (event) {
    let message
    try {
      message = JSON.parse(event.data)
    } catch (e) {
      console.error("Error parsing websocket message JSON", e)
      return
    }
    this.emitter.emit('message', message)
  }

  onSocketError (error) {
    console.error("websocket text relay connection error: ", error)
  }

  sendMessage (message) {
    const messageStr = JSON.stringify(message)
    this.sessionMessages.push(messageStr)
    if (!this.socketOpen) { return }
    this.socket.send(messageStr)
  }
}
