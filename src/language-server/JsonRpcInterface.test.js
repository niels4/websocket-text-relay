import { describe, it, expect, beforeAll } from "vitest"
import { PassThrough, Writable } from 'node:stream'
import { JsonRpcInterface } from "./JsonRpcInterface.js"
import { TESTONLY_resetRequestId } from "./LspWriter.js"
import { invalidRequestErrorCode, invalidRequestErrorMessage, methodNotFoundErrorCode, methodNotFoundErrorMessage, unexpectedNotificationErrorCode,
  unexpectedNotificationErrorMessage, unexpectedRequestErrorCode, unexpectedRequestErrorMessage } from "./constants.js"

describe("JsonRpcInterface", () => {
  describe("onNotification", () => {
    describe("when a we receive a notification message that has a handler", () => {
      let inputStream, outputStream, jsonRpc
      const incomingMessage = `Content-Length: 64\r\n\r\n{"jsonrpc":"2.0","method":"test/test-method","params":{"a":"1"}}`
      const expectedParams = {a: "1"}
      let actualParams = null

      beforeAll(() => {
        inputStream = new PassThrough()
        outputStream = new PassThrough()
        jsonRpc = new JsonRpcInterface({inputStream, outputStream})

        jsonRpc.onNotification("test/test-method", (params) => {
          actualParams= params
        })

        inputStream.write(incomingMessage)
      })

      it("should call the handler with the correct params", () => {
        expect(actualParams).to.deep.equal(expectedParams)
      })
    })

    describe("when attempting to register duplicate onNotification handlers ", () => {
      let inputStream, outputStream, jsonRpc
      let f1 = () => {}
      let f2 = () => {}

      beforeAll(() => {
        inputStream = new PassThrough()
        outputStream = new PassThrough()
        jsonRpc = new JsonRpcInterface({inputStream, outputStream})

        jsonRpc.onNotification("test/test-method", f1)

      })

      it("should throw an error if we try to register the same method twice (without first removing the handler)", () => {
        expect(() => jsonRpc.onNotification("test/test-method", f2)).to.toThrowError(/duplicate method handlers/i)
      })
    })

    describe("when using removeNotificationHandler to change the existing method handler", () => {
      let inputStream, outputStream, jsonRpc
      const incomingMessage = `Content-Length: 64\r\n\r\n{"jsonrpc":"2.0","method":"test/test-method","params":{"a":"1"}}`
      let f1Fired = false
      let f2Fired = false
      let f1 = () => f1Fired = true
      let f2 = () => f2Fired = true

      beforeAll(() => {
        inputStream = new PassThrough()
        outputStream = new PassThrough()
        jsonRpc = new JsonRpcInterface({inputStream, outputStream})

        jsonRpc.onNotification("test/test-method", f1)
        jsonRpc.removeNotificationHandler("test/test-method")
        jsonRpc.onNotification("test/test-method", f2)

        inputStream.write(incomingMessage)
      })

      it("should call function f2 instead of f1", () => {
        expect(f1Fired).to.equal(false)
        expect(f2Fired).to.equal(true)
      })
    })

    describe("when a notification handler throws an error", () => {
      let inputStream, outputStream, jsonRpc
      const incomingMessage = `Content-Length: 64\r\n\r\n{"jsonrpc":"2.0","method":"test/test-method","params":{"a":"1"}}`
      const expectedError = {code: unexpectedNotificationErrorCode, message: unexpectedNotificationErrorMessage, data: {method: "test/test-method", params: {a: "1"}, error: "Test notification error"}}
      let actualError

      beforeAll(() => {
        inputStream = new PassThrough()
        outputStream = new PassThrough()
        jsonRpc = new JsonRpcInterface({inputStream, outputStream})

        jsonRpc.onNotification("test/test-method", () => {
          throw new Error("Test notification error")
        })

        jsonRpc.events.on('notification-error', (error) => {
          actualError = error
        })

        inputStream.write(incomingMessage)
      })

      it("should fire the notification-error event with the correct error data", () => {
        expect(actualError).to.deep.equal(expectedError)
      })
    })

    describe("when we receive a notification without a handler", () => {
      let inputStream, outputStream, jsonRpc
      const incomingMessage = `Content-Length: 64\r\n\r\n{"jsonrpc":"2.0","method":"test/test-method","params":{"a":"1"}}`
      const expectedError = {code: methodNotFoundErrorCode, message: methodNotFoundErrorMessage, data: {method: "test/test-method"}}
      let actualError

      beforeAll(() => {
        inputStream = new PassThrough()
        outputStream = new PassThrough()
        jsonRpc = new JsonRpcInterface({inputStream, outputStream})

        jsonRpc.events.on('notification-error', (error) => {
          actualError = error
        })

        inputStream.write(incomingMessage)
      })

      it("should fire the notification-error event with the correct error data", () => {
        expect(actualError).to.deep.equal(expectedError)
      })
    })
  })

  describe("onRequest", () => {
    describe("when a we receive a request message that has a handler", () => {
      const incomingMessage = `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`
      const expectedParams = {a: "1"}
      let actualParams = null
      const expectedOutput = `Content-Length: 54\r\n\r\n{"jsonrpc":"2.0","id":"0","result":{"someValue":"33"}}`
      let actualOutput = ""

      beforeAll(() => {
        const inputStream = new PassThrough()
        const outputStream = new Writable({
          write (data, _enc, next) {
            actualOutput += data.toString()
            next()
          }
        })
        const jsonRpc = new JsonRpcInterface({inputStream, outputStream})

        jsonRpc.onRequest("test/test-method", (params) => {
          actualParams= params
          return {someValue: "33"}
        })

        inputStream.write(incomingMessage)
      })

      it("should call the handler with the correct params", () => {
        expect(actualParams).to.deep.equal(expectedParams)
      })

      it("should write the response to the output stream", () => {
        expect(actualOutput).toEqual(expectedOutput)
      })
    })

    describe("should be able to use an async function as a handler", () => {
      const incomingMessage = `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`
      const expectedParams = {a: "1"}
      let actualParams = null
      const expectedOutput = `Content-Length: 54\r\n\r\n{"jsonrpc":"2.0","id":"0","result":{"someValue":"34"}}`
      let actualOutput = ""

      beforeAll(() => {
        const inputStream = new PassThrough()
        const outputStream = new Writable({
          write (data, _enc, next) {
            actualOutput += data.toString()
            next()
          }
        })
        const jsonRpc = new JsonRpcInterface({inputStream, outputStream})

        jsonRpc.onRequest("test/test-method", async (params) => {
          actualParams= params
          const someValue = await new Promise((resolve) => {
            setTimeout(() => resolve("34"), 1)
          })
          return {someValue}
        })

        inputStream.write(incomingMessage)
      })

      it("should call the handler with the correct params", () => {
        expect(actualParams).to.deep.equal(expectedParams)
      })

      it("should not write the response until the promise resolves", () => {
        expect(actualOutput).toEqual("")
      })

      it("should write the response after the async function resolves with the result", async () => {
        await new Promise((resolve) => setTimeout(resolve, 1))
        expect(actualOutput).toEqual(expectedOutput)
      })
    })

    describe("when attempting to register duplicate onRequest handlers ", () => {
      let inputStream, outputStream, jsonRpc
      let f1 = () => {}
      let f2 = () => {}

      beforeAll(() => {
        inputStream = new PassThrough()
        outputStream = new PassThrough()
        jsonRpc = new JsonRpcInterface({inputStream, outputStream})

        jsonRpc.onRequest("test/test-method", f1)

      })

      it("should throw an error if we try to register the same method twice (without first removing the handler)", () => {
        expect(() => jsonRpc.onRequest("test/test-method", f2)).to.toThrowError(/duplicate method handlers/i)
      })
    })

    describe("when using removeRequestHandler to change the existing method handler", () => {
      const incomingMessage = `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`
      let f1Fired = false
      let f2Fired = false
      let f1 = () => f1Fired = true
      let f2 = () => f2Fired = true

      beforeAll(() => {
        const inputStream = new PassThrough()
        const outputStream = new PassThrough()
        const jsonRpc = new JsonRpcInterface({inputStream, outputStream})

        jsonRpc.onRequest("test/test-method", f1)
        jsonRpc.removeRequestHandler("test/test-method")
        jsonRpc.onRequest("test/test-method", f2)

        inputStream.write(incomingMessage)
      })

      it("should call function f2 instead of f1", () => {
        expect(f1Fired).to.equal(false)
        expect(f2Fired).to.equal(true)
      })
    })

    describe("when a request handler throws an error", () => {
      const incomingMessage = `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`
      const expectedError = {id: "0", error: {code: unexpectedRequestErrorCode, message: unexpectedRequestErrorMessage, data: {method: "test/test-method", params: {a: "1"}, error: "Test request error"}}}
      let actualError
      const expectedOutput = `Content-Length: 179\r\n\r\n{"jsonrpc":"2.0","id":"0","error":{"code":-2,"message":"${unexpectedRequestErrorMessage}","data":{"method":"test/test-method","params":{"a":"1"},"error":"Test request error"}}}`
      let actualOutput = ""

      beforeAll(() => {
        const inputStream = new PassThrough()
        const outputStream = new Writable({
          write (data, _enc, next) {
            actualOutput += data.toString()
            next()
          }
        })
        const jsonRpc = new JsonRpcInterface({inputStream, outputStream})

        jsonRpc.onRequest("test/test-method", () => {
          throw new Error("Test request error")
        })

        jsonRpc.events.on('request-error', (error) => {
          actualError = error
        })

        inputStream.write(incomingMessage)
      })

      it("should fire the notification-error event with the correct error data", () => {
        expect(actualError).to.deep.equal(expectedError)
      })

      it("should write the error to the output stream", () => {
        expect(actualOutput).toEqual(expectedOutput)
      })
    })

    describe("when we receive a request without a handler", () => {
      const incomingMessage = `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`
      const expectedError = {id: "0", error: {code: methodNotFoundErrorCode, message: methodNotFoundErrorMessage, data: {method: "test/test-method"}}}
      let actualError
      const expectedOutput = `Content-Length: 116\r\n\r\n{"jsonrpc":"2.0","id":"0","error":{"code":-32601,"message":"${methodNotFoundErrorMessage}","data":{"method":"test/test-method"}}}`
      let actualOutput = ""

      beforeAll(() => {
        const inputStream = new PassThrough()
        const outputStream = new Writable({
          write (data, _enc, next) {
            actualOutput += data.toString()
            next()
          }
        })
        const jsonRpc = new JsonRpcInterface({inputStream, outputStream})

        jsonRpc.events.on('request-error', (error) => {
          actualError = error
        })

        inputStream.write(incomingMessage)
      })

      it("should fire the notification-error event with the correct error data", () => {
        expect(actualError).to.deep.equal(expectedError)
      })

      it("should write the error to the output stream", () => {
        expect(actualOutput).toEqual(expectedOutput)
      })
    })
  })

  describe("sendNotification", () => {
    const method = "test/test-method"
    const parameters = {"a": "1"}
    const expectedOutput = `Content-Length: 64\r\n\r\n{"jsonrpc":"2.0","method":"test/test-method","params":{"a":"1"}}`
    let actualOutput = ""

    beforeAll(() => {
      const inputStream = new PassThrough()
      const outputStream = new Writable({
        write (data, _enc, next) {
          actualOutput += data.toString()
          next()
        }
      })
      const jsonRpc = new JsonRpcInterface({inputStream, outputStream})
      jsonRpc.sendNotification(method, parameters)
    })

    it("should write a notification message without an ID property on the output stream", () => {
      expect(actualOutput).toEqual(expectedOutput)
    })
  })

  describe("sendRequest", () => {
    describe("with result response", () => {
      const method = "test/test-method"
      const parameters = {"a": "1"}
      const expectedOutput = `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`
      let actualOutput = ""
      const clientResponse = `Content-Length: 52\r\n\r\n{"jsonrpc":"2.0","id":"0","result":{"testVal":"39"}}`
      const expectedResult = {testVal: "39"}
      let actualResult = null
      let inputStream, requestPromise

      beforeAll(() => {
        TESTONLY_resetRequestId()
        inputStream = new PassThrough()
        const outputStream = new Writable({
          write (data, _enc, next) {
            actualOutput += data.toString()
            next()
          }
        })
        const jsonRpc = new JsonRpcInterface({inputStream, outputStream})
        requestPromise = jsonRpc.sendRequest(method, parameters)
        requestPromise.then((result) => {
          actualResult = result
        })
      })

      it("should write the request message to the output stream", () => {
        expect(actualOutput).toEqual(expectedOutput)
      })

      it("should return an unresolved promise", () => {
        expect(requestPromise).toBeInstanceOf(Promise)
        expect(actualResult).toBeNull()
      })

      it("should resolve the promise when the client responds with a result", async () => {
        inputStream.write(clientResponse)
        const result = await requestPromise
        expect(result).to.deep.equal(expectedResult)
      })
    })

    describe("with error response", () => {
      const method = "test/test-method"
      const parameters = {"a": "1"}
      const expectedOutput = `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`
      let actualOutput = ""
      const clientResponse = `Content-Length: 83\r\n\r\n{"jsonrpc":"2.0","id":"0","error":{"code":1,"message":"test error","data":{"t":5}}}`
      const expectedError = {"code":1,"message":"test error","data":{"t":5}}
      let actualResult = null
      let inputStream, requestPromise

      beforeAll(() => {
        TESTONLY_resetRequestId()
        inputStream = new PassThrough()
        const outputStream = new Writable({
          write (data, _enc, next) {
            actualOutput += data.toString()
            next()
          }
        })
        const jsonRpc = new JsonRpcInterface({inputStream, outputStream})
        requestPromise = jsonRpc.sendRequest(method, parameters)
        requestPromise.catch((result) => {
          actualResult = result
        })
      })

      it("should write the request message to the output stream", () => {
        expect(actualOutput).toEqual(expectedOutput)
      })

      it("should return an unresolved promise", () => {
        expect(requestPromise).toBeInstanceOf(Promise)
        expect(actualResult).toBeNull()
      })

      it("should reject the promise when the client responds with an error", async () => {
        inputStream.write(clientResponse)
        await requestPromise.catch((error) => {
          expect(error).to.deep.equal(expectedError)
        })
      })
    })
  })
  
  describe("when the lspInputStream encounters a parse-error", () => {
    const error = {code: 1, message: "test error", data: {t: 5}}
    const expectedOutput = `Content-Length: 84\r\n\r\n{"jsonrpc":"2.0","id":null,"error":{"code":1,"message":"test error","data":{"t":5}}}`
    let actualOutput = ""

    beforeAll(() => {
      const inputStream = new PassThrough()
      const outputStream = new Writable({
        write (data, _enc, next) {
          actualOutput += data.toString()
          next()
        }
      })
      const jsonRpc = new JsonRpcInterface({inputStream, outputStream})
      jsonRpc.lspInputStream.emit('parse-error', error)
    })

    it("should write the error to the output stream", () => {
      expect(actualOutput).toEqual(expectedOutput)
    })
  })

  describe("_handlRequestResponse: when there is no response handler", () => {
    let jsonRpc

    beforeAll(() => {
      const inputStream = new PassThrough()
      const outputStream = new PassThrough()
      jsonRpc = new JsonRpcInterface({inputStream, outputStream})
    })

    it("should not throw an error when there is not a response handler for that id", () => {
      jsonRpc._handleRequestResponse(33)
    })
  })

  describe("_handleIncomingLspMessage: when there is no id or method", () => {
    let jsonRpc, actualError
    let actualOutput = ""
    const expectedError = {code: invalidRequestErrorCode, message: invalidRequestErrorMessage}
    const expectedOutput = `Content-Length: 105\r\n\r\n{"jsonrpc":"2.0","id":null,"error":{"code":${invalidRequestErrorCode},"message":"${invalidRequestErrorMessage}"}}`

    beforeAll(() => {
      const inputStream = new PassThrough()
      const outputStream = new Writable({
        write (data, _enc, next) {
          actualOutput += data.toString()
          next()
        }
      })
      jsonRpc = new JsonRpcInterface({inputStream, outputStream})
      jsonRpc.events.on('rpc-error', (error) => {
        actualError = error
      })
      jsonRpc._handleIncomingLspMessage({id: null, message: null})
    })

    it("should emit an rpc-error event on the events emitter", () => {
      expect(actualError).to.deep.equal(expectedError)
    })

    it("should notify the client that it sent an invalid rpc message", () => {
      expect(actualOutput).toEqual(expectedOutput)
    })
  })
})
