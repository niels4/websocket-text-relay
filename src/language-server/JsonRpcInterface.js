import { EventEmitter } from "node:events"
import { LspReader } from "./LspReader.js"
import { writeNotification, writeRequest, writeResponse } from "./LspWriter.js"
import {
  invalidRequestErrorCode,
  invalidRequestErrorMessage,
  methodNotFoundErrorCode,
  methodNotFoundErrorMessage,
  unexpectedNotificationErrorCode,
  unexpectedNotificationErrorMessage,
  unexpectedRequestErrorCode,
  unexpectedRequestErrorMessage,
} from "./constants.js"

export class JsonRpcInterface {
  constructor({ inputStream, outputStream }) {
    this.inputStream = inputStream
    this.outputStream = outputStream

    this.outstandingRequests = new Map()
    this.events = new EventEmitter()
    this.notificationHandlers = new Map()
    this.requestHandlers = new Map()
    this.lspInputStream = new LspReader()
    this.inputStream.pipe(this.lspInputStream)

    this.lspInputStream.on("data", this._handleIncomingLspMessage.bind(this))

    this.lspInputStream.on("parse-error", (error) => {
      writeResponse(this.outputStream, null, error)
    })
  }

  onNotification(method, handler) {
    if (this.notificationHandlers.has(method)) {
      throw new Error(
        "Can only register one notification handler at a time. Duplicate method handlers for " + method,
      )
    }
    this.notificationHandlers.set(method, handler)
  }

  removeNotificationHandler(method) {
    return this.notificationHandlers.delete(method)
  }

  onRequest(method, handler) {
    if (this.requestHandlers.has(method)) {
      throw new Error(
        "Can only register one request handler at a time. Duplicate method handlers for " + method,
      )
    }
    this.requestHandlers.set(method, handler)
  }

  removeRequestHandler(method) {
    return this.requestHandlers.delete(method)
  }

  sendNotification(method, params) {
    writeNotification(this.outputStream, method, params)
  }

  sendRequest(method, params) {
    const responseHandler = {}
    const promise = new Promise((resolve, reject) => {
      responseHandler.resolve = resolve
      responseHandler.reject = reject
    })
    const id = writeRequest(this.outputStream, method, params)
    this.outstandingRequests.set(id, responseHandler)
    return promise
  }

  _handleIncomingLspMessage(message) {
    const { method, params, id, error, result } = message
    if (id != null) {
      if (method != null) {
        this._handleIncomingRequest(method, params, id)
      } else {
        this._handleRequestResponse(id, error, result)
      }
      return
    }

    if (method != null) {
      this._handleIncomingNotification(method, params)
      return
    }
    const rpcError = { code: invalidRequestErrorCode, message: invalidRequestErrorMessage }
    this.events.emit("rpc-error", rpcError)
    writeResponse(this.outputStream, null, rpcError)
  }

  _handleIncomingNotification(method, params) {
    const handler = this.notificationHandlers.get(method)
    if (!handler) {
      const errorObject = {
        code: methodNotFoundErrorCode,
        message: methodNotFoundErrorMessage,
        data: { method },
      }
      this.events.emit("notification-error", errorObject)
      return
    }
    try {
      handler(params)
    } catch (error) {
      const errorObject = {
        code: unexpectedNotificationErrorCode,
        message: unexpectedNotificationErrorMessage,
        data: { method, params, error: error.message },
      }
      this.events.emit("notification-error", errorObject)
    }
  }

  async _handleIncomingRequest(method, params, id) {
    const handler = this.requestHandlers.get(method)
    if (!handler) {
      const errorObject = {
        code: methodNotFoundErrorCode,
        message: methodNotFoundErrorMessage,
        data: { method },
      }
      writeResponse(this.outputStream, id, errorObject)
      this.events.emit("request-error", { id, error: errorObject })
      return
    }
    try {
      const result = await handler(params)
      writeResponse(this.outputStream, id, null, result)
    } catch (error) {
      const errorObject = {
        code: unexpectedRequestErrorCode,
        message: unexpectedRequestErrorMessage,
        data: { method, params, error: error.message },
      }
      this.events.emit("request-error", { id, error: errorObject })
      writeResponse(this.outputStream, id, errorObject)
    }
  }

  _handleRequestResponse(id, error, result) {
    const responseHandler = this.outstandingRequests.get(id)
    if (!responseHandler) {
      return
    }
    this.outstandingRequests.delete(id)
    if (error != null) {
      responseHandler.reject(error)
    } else {
      responseHandler.resolve(result)
    }
  }
}
