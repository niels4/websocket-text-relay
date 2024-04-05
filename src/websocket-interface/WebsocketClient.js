import WebSocket from 'ws'

export class WebsocketClient {
  constructor ({port, wsInterfaceEmitter, host = "localhost", protocol = "ws"}) {
    this.port = port
    this.host = host
    this.protocol = protocol
    this.wsInterfaceEmitter = wsInterfaceEmitter
    this.socket = null
    this.socketOpen = false

    this._onSocketOpen = this.onSocketOpen.bind(this)
    this._onSocketMessage = this.onSocketMessage.bind(this)
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
    this.socket.addEventListener('close', this._onSocketClose)
  }

  onSocketOpen () {
    this.socketOpen = true
  }

  onSocketClose () {
    this.socketOpen = false
    this.socket.removeEventListener('open', this._onSocketOpen)
    this.socket.removeEventListener('message', this._onSocketMessage)
    this.socket.removeEventListener('close', this._onSocketClose)
  }

  onSocketMessage (event) {
    let message
    try {
      message = JSON.parse(event.data)
    } catch (e) {
      console.error("Error parsing websocket message JSON", e)
      return
    }
    this.wsInterfaceEmitter.emit('message', message)
  }

  sendMessage (message) {
    const messageStr = JSON.stringify(message)
    this.socket.send(messageStr)
  }
}
