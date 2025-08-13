import { Writable } from "node:stream"
import { describe, it, expect, beforeAll } from "vitest"
import {
  TESTONLY_resetRequestId,
  createHeader,
  writeNotification,
  writeRequest,
  writeResponse,
  writeToOutput,
} from "./LspWriter.js"

describe("LspWriter", () => {
  describe("createHeader", () => {
    describe("Simple Case", () => {
      const messageObj = {}
      const expectedHeader = "Content-Length: 2\r\n\r\n"

      it("Should create header with correct length", () => {
        const actual = createHeader(JSON.stringify(messageObj))
        expect(actual).toEqual(expectedHeader)
      })
    })

    describe("With some content", () => {
      const messageObj = { a: "1" }
      const expectedHeader = "Content-Length: 9\r\n\r\n"

      it("Should create header with correct length", () => {
        const actual = createHeader(JSON.stringify(messageObj))
        expect(actual).toEqual(expectedHeader)
      })
    })

    describe("With multi byte characters", () => {
      const messageObj = { a: "🌊" }
      const expectedHeader = "Content-Length: 12\r\n\r\n"

      it("Should create header with correct byte length, not string length", () => {
        const actual = createHeader(JSON.stringify(messageObj))
        expect(actual).toEqual(expectedHeader)
      })
    })
  })

  describe("writeToOutput", () => {
    describe("simple object", () => {
      const messageObj = { a: "1" }
      const expectedOutput = `Content-Length: 9\r\n\r\n{"a":"1"}`
      let actualOutput = ""

      beforeAll(() => {
        const outputStream = new Writable({
          write(data, _enc, next) {
            actualOutput += data.toString()
            next()
          },
        })
        writeToOutput(outputStream, messageObj)
      })

      it("should stringify the json and add a Content-Length header, then write the head and json to the output stream", () => {
        expect(actualOutput).toEqual(expectedOutput)
      })
    })
  })

  describe("writeResponse", () => {
    describe("successful response", () => {
      const result = { a: "1" }
      const error = null
      const expectedOutput = `Content-Length: 45\r\n\r\n{"jsonrpc":"2.0","id":"0","result":{"a":"1"}}`
      let actualOutput = ""

      beforeAll(() => {
        const outputStream = new Writable({
          write(data, _enc, next) {
            actualOutput += data.toString()
            next()
          },
        })
        writeResponse(outputStream, "0", error, result)
      })

      it("should create a response object with a result property (and no error) and write it to the output stream", () => {
        expect(actualOutput).toEqual(expectedOutput)
      })
    })

    describe("error response", () => {
      const result = null
      const error = { code: 1, message: "test error", data: { t: 5 } }
      const expectedOutput = `Content-Length: 83\r\n\r\n{"jsonrpc":"2.0","id":"0","error":{"code":1,"message":"test error","data":{"t":5}}}`
      let actualOutput = ""

      beforeAll(() => {
        const outputStream = new Writable({
          write(data, _enc, next) {
            actualOutput += data.toString()
            next()
          },
        })
        writeResponse(outputStream, "0", error, result)
      })

      it("should create a response object with an error property (and no result) and write it to the output stream", () => {
        expect(actualOutput).toEqual(expectedOutput)
      })
    })
  })

  describe("writeNotification", () => {
    describe("simple parameters", () => {
      const method = "test/test-method"
      const parameters = { a: "1" }
      const expectedOutput = `Content-Length: 64\r\n\r\n{"jsonrpc":"2.0","method":"test/test-method","params":{"a":"1"}}`
      let actualOutput = ""

      beforeAll(() => {
        const outputStream = new Writable({
          write(data, _enc, next) {
            actualOutput += data.toString()
            next()
          },
        })
        writeNotification(outputStream, method, parameters)
      })

      it("should write a notification message without an ID property on the output stream", () => {
        expect(actualOutput).toEqual(expectedOutput)
      })
    })
  })

  describe("writeReqest", () => {
    describe("single request", () => {
      const method = "test/test-method"
      const parameters = { a: "1" }
      const expectedOutput = `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`
      let actualOutput = ""

      beforeAll(() => {
        TESTONLY_resetRequestId()
        const outputStream = new Writable({
          write(data, _enc, next) {
            actualOutput += data.toString()
            next()
          },
        })
        writeRequest(outputStream, method, parameters)
      })

      it("should write a request message with an ID property on the output stream", () => {
        expect(actualOutput).toEqual(expectedOutput)
      })
    })

    describe("multiple requests", () => {
      const method = "test/test-method"
      const params1 = { a: "1" }
      const params2 = { b: "2" }
      const params3 = { c: "3" }
      const expectedOutput1 = `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`
      const expectedOutput2 = `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"1","method":"test/test-method","params":{"b":"2"}}`
      const expectedOutput3 = `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"2","method":"test/test-method","params":{"c":"3"}}`
      const expectedOutput = expectedOutput1 + expectedOutput2 + expectedOutput3
      let actualOutput = ""

      beforeAll(() => {
        TESTONLY_resetRequestId()
        const outputStream = new Writable({
          write(data, _enc, next) {
            actualOutput += data.toString()
            next()
          },
        })
        writeRequest(outputStream, method, params1)
        writeRequest(outputStream, method, params2)
        writeRequest(outputStream, method, params3)
      })

      it("should write multiple request messages with increasing IDs", () => {
        expect(actualOutput).toEqual(expectedOutput)
      })
    })
  })
})
