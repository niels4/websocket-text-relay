import assert from "node:assert/strict"
import { PassThrough } from "node:stream"
import { before as beforeAll, describe, it } from "node:test"
import { parseErrorCode, parseHeaderErrorMessage, parseJsonErrorMessage } from "./constants.js"
import { LspReader } from "./LspReader.js"

describe("LspReader", () => {
  describe("simple case", () => {
    describe("when a message comes through the input stream", () => {
      const inputData = `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`
      const expectedMessageObj = {
        jsonrpc: "2.0",
        id: "0",
        method: "test/test-method",
        params: { a: "1" },
      }
      let actualMessageObj

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on("data", (message) => {
          actualMessageObj = message
        })
        inputStream.write(inputData)
      })

      it("should parse the incoming data and emit the json rpc message object", () => {
        assert.deepStrictEqual(actualMessageObj, expectedMessageObj)
      })
    })

    describe("when content-length header isn't capitalized", () => {
      const inputData = `content-length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`
      const expectedMessageObj = {
        jsonrpc: "2.0",
        id: "0",
        method: "test/test-method",
        params: { a: "1" },
      }
      let actualMessageObj

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on("data", (message) => {
          actualMessageObj = message
        })
        inputStream.write(inputData)
      })

      it("should parse the incoming data and emit the json rpc message object", () => {
        assert.deepStrictEqual(actualMessageObj, expectedMessageObj)
      })
    })
  })

  describe("error cases", () => {
    describe("when Content-Length header is missing", () => {
      const inputData = `Bad-Header: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`
      const expectedError = { code: parseErrorCode, message: parseHeaderErrorMessage }
      let actualMessageObj = null
      let actualError

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on("data", (message) => {
          actualMessageObj = message
        })
        lspReader.on("parse-error", (error) => {
          actualError = error
        })
        inputStream.write(inputData)
      })

      it("should emit an 'parse-error' event with the parse header error message", () => {
        assert.deepStrictEqual(actualError, expectedError)
      })

      it("should not emit any objects", () => {
        assert.strictEqual(actualMessageObj, null)
      })
    })

    describe("when recovering from a bad header error", () => {
      const inputData = [
        `Bad-Header: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`,
        `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"1","method":"test/test-method","params":{"b":"2"}}`,
      ]
      const expectedError = { code: parseErrorCode, message: parseHeaderErrorMessage }
      const expectedObject = {
        jsonrpc: "2.0",
        id: "1",
        method: "test/test-method",
        params: { b: "2" },
      }
      const actualMessageObjs = []
      const actualErrors = []

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on("data", (message) => {
          actualMessageObjs.push(message)
        })
        lspReader.on("parse-error", (error) => {
          actualErrors.push(error)
        })
        inputData.forEach((data) => {
          inputStream.write(data)
        })
      })

      it("should emit only 1 'parse-error' event with the parse header error message", () => {
        assert.strictEqual(actualErrors.length, 1)
        assert.deepStrictEqual(actualErrors[0], expectedError)
      })

      it("should not emit one object from the message with the valid header", () => {
        assert.strictEqual(actualMessageObjs.length, 1)
        assert.deepStrictEqual(actualMessageObjs[0], expectedObject)
      })
    })

    describe("when recovering from an invalid JSON error", () => {
      const inputData = [
        `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}>`,
        `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"1","method":"test/test-method","params":{"b":"2"}}`,
      ]
      const expectedError = { code: parseErrorCode, message: parseJsonErrorMessage }
      const expectedObject = {
        jsonrpc: "2.0",
        id: "1",
        method: "test/test-method",
        params: { b: "2" },
      }
      const actualMessageObjs = []
      const actualErrors = []

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on("data", (message) => {
          actualMessageObjs.push(message)
        })
        lspReader.on("parse-error", (error) => {
          actualErrors.push(error)
        })
        inputData.forEach((data) => {
          inputStream.write(data)
        })
      })

      it("should emit only 1 'parse-error' event with the parse header error message", () => {
        assert.strictEqual(actualErrors.length, 1)
        assert.deepStrictEqual(actualErrors[0], expectedError)
      })

      it("should not emit one object from the message with the valid header", () => {
        assert.strictEqual(actualMessageObjs.length, 1)
        assert.deepStrictEqual(actualMessageObjs[0], expectedObject)
      })
    })

    describe("when JSON is invalid", () => {
      const inputData = `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}>`
      const expectedError = { code: parseErrorCode, message: parseJsonErrorMessage }
      let actualMessageObj = null
      let actualError

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on("data", (message) => {
          actualMessageObj = message
        })
        lspReader.on("parse-error", (error) => {
          actualError = error
        })
        inputStream.write(inputData)
      })

      it("should emit an 'parse-error' event with the parse JSON error message", () => {
        assert.deepStrictEqual(actualError, expectedError)
      })

      it("should not emit any objects", () => {
        assert.strictEqual(actualMessageObj, null)
      })
    })
  })

  describe("single message buffering cases", () => {
    describe("when the message is split in the middle of the header", () => {
      const inputData = [
        `Content-Len`,
        `gth: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`,
      ]
      const expectedMessageObj = {
        jsonrpc: "2.0",
        id: "0",
        method: "test/test-method",
        params: { a: "1" },
      }
      let actualMessageObj
      let actualError = null

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on("data", (message) => {
          actualMessageObj = message
        })
        lspReader.on("parse-error", (error) => {
          actualError = error
        })

        inputData.forEach((dataChunk) => {
          inputStream.write(dataChunk)
        })
      })

      it("should not emit an error", () => {
        assert.strictEqual(actualError, null)
      })

      it("should buffer the data until it can parse the incoming data and emit the json rpc message object", () => {
        assert.deepStrictEqual(actualMessageObj, expectedMessageObj)
      })
    })

    describe("when the message is split in the middle of the header many times", () => {
      const inputData = [
        `Cont`,
        `ent-L`,
        `en`,
        `gth`,
        `: 7`,
        `3\r`,
        `\n`,
        `\r\n`,
        `{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`,
      ]
      const expectedMessageObj = {
        jsonrpc: "2.0",
        id: "0",
        method: "test/test-method",
        params: { a: "1" },
      }
      let actualMessageObj
      let actualError = null

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on("data", (message) => {
          actualMessageObj = message
        })
        lspReader.on("parse-error", (error) => {
          actualError = error
        })

        inputData.forEach((dataChunk) => {
          inputStream.write(dataChunk)
        })
      })

      it("should not emit an error", () => {
        assert.strictEqual(actualError, null)
      })

      it("should buffer the data until it can parse the incoming data and emit the json rpc message object", () => {
        assert.deepStrictEqual(actualMessageObj, expectedMessageObj)
      })
    })

    describe("when the message is split in the middle of the JSON", () => {
      const inputData = [
        `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0",`,
        `"id":"0","method":"test/test-method","params":{"a":"1"}}`,
      ]
      const expectedMessageObj = {
        jsonrpc: "2.0",
        id: "0",
        method: "test/test-method",
        params: { a: "1" },
      }
      let actualMessageObj
      let actualError = null

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on("data", (message) => {
          actualMessageObj = message
        })
        lspReader.on("parse-error", (error) => {
          actualError = error
        })

        inputData.forEach((dataChunk) => {
          inputStream.write(dataChunk)
        })
      })

      it("should not emit an error", () => {
        assert.strictEqual(actualError, null)
      })

      it("should buffer the data until it can parse the incoming data and emit the json rpc message object", () => {
        assert.deepStrictEqual(actualMessageObj, expectedMessageObj)
      })
    })

    describe("when the message is split in the middle of the header and JSON many times", () => {
      const inputData = [
        `Con`,
        `tent-Len`,
        `gth: 73\r`,
        `\n`,
        `\r\n`,
        `{`,
        `"jso`,
        `nrpc":"2.0"`,
        `,"id":"0","method":"te`,
        `st/test-method","params":{"a":`,
        `"1"}`,
        `}`,
      ]
      const expectedMessageObj = {
        jsonrpc: "2.0",
        id: "0",
        method: "test/test-method",
        params: { a: "1" },
      }
      let actualMessageObj
      let actualError = null

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on("data", (message) => {
          actualMessageObj = message
        })
        lspReader.on("parse-error", (error) => {
          actualError = error
        })

        inputData.forEach((dataChunk) => {
          inputStream.write(dataChunk)
        })
      })

      it("should not emit an error", () => {
        assert.strictEqual(actualError, null)
      })

      it("should buffer the data until it can parse the incoming data and emit the json rpc message object", () => {
        assert.deepStrictEqual(actualMessageObj, expectedMessageObj)
      })
    })
  })

  describe("when the buffer needs resizing", () => {
    describe("when a message larger than the buffer size comes through the input stream", () => {
      const inputData = `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`
      const expectedMessageObj = {
        jsonrpc: "2.0",
        id: "0",
        method: "test/test-method",
        params: { a: "1" },
      }
      let lspReader
      let actualMessageObj
      let actualInitialBufferSize

      beforeAll(() => {
        const inputStream = new PassThrough()
        lspReader = new LspReader({ initialBufferSize: 10 })
        actualInitialBufferSize = lspReader.buffer.length
        inputStream.pipe(lspReader)
        lspReader.on("data", (message) => {
          actualMessageObj = message
        })
        inputStream.write(inputData)
      })

      it("should construct the lspReader with the passed in initialBufferSize", () => {
        assert.strictEqual(actualInitialBufferSize, 10)
      })

      it("should need to trigger a resize", () => {
        assert.strictEqual(inputData.length > actualInitialBufferSize, true)
      })

      it("should increase the buffer to a size larger than the message chunk", () => {
        assert.strictEqual(lspReader.buffer.length > inputData.length, true)
      })

      it("should parse the incoming data and emit the json rpc message object", () => {
        assert.deepStrictEqual(actualMessageObj, expectedMessageObj)
      })
    })

    describe("when a buffer that already has data needs resizing", () => {
      const inputData = [
        `Content-Len`,
        `gth: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`,
      ]
      const expectedMessageObj = {
        jsonrpc: "2.0",
        id: "0",
        method: "test/test-method",
        params: { a: "1" },
      }
      let actualMessageObj
      let lspReader
      let actualInitialBufferSize
      let actualError = null

      beforeAll(() => {
        const inputStream = new PassThrough()
        lspReader = new LspReader({ initialBufferSize: 70 })
        actualInitialBufferSize = lspReader.buffer.length
        inputStream.pipe(lspReader)
        lspReader.on("data", (message) => {
          actualMessageObj = message
        })
        lspReader.on("parse-error", (error) => {
          actualError = error
        })

        inputData.forEach((dataChunk) => {
          inputStream.write(dataChunk)
        })
      })

      it("should not emit an error", () => {
        assert.strictEqual(actualError, null)
      })

      it("should construct the lspReader with the passed in initialBufferSize", () => {
        assert.strictEqual(actualInitialBufferSize, 70)
      })

      it("should need to trigger a resize after the first buffered message", () => {
        assert.strictEqual(inputData[0].length < actualInitialBufferSize, true)
        assert.strictEqual(inputData[1].length > actualInitialBufferSize, true)
      })

      it("should increase the buffer to a size larger than the combined message chunks", () => {
        assert.strictEqual(lspReader.buffer.length > inputData[0].length + inputData[1].length, true)
      })

      it("should buffer the data until it can parse the incoming data and emit the json rpc message object", () => {
        assert.deepStrictEqual(actualMessageObj, expectedMessageObj)
      })
    })
  })

  describe("when multiple message come in separate chunks", () => {
    const inputData = [
      `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`,
      `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"1","method":"test/test-method","params":{"b":"2"}}`,
      `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"2","method":"test/test-method","params":{"c":"3"}}`,
    ]

    const expectedMessageObjs = [
      { jsonrpc: "2.0", id: "0", method: "test/test-method", params: { a: "1" } },
      { jsonrpc: "2.0", id: "1", method: "test/test-method", params: { b: "2" } },
      { jsonrpc: "2.0", id: "2", method: "test/test-method", params: { c: "3" } },
    ]
    const actualMessageObjs = []
    let actualError = null

    beforeAll(() => {
      const inputStream = new PassThrough()
      const lspReader = new LspReader()
      inputStream.pipe(lspReader)
      lspReader.on("data", (message) => {
        actualMessageObjs.push(message)
      })
      lspReader.on("parse-error", (error) => {
        actualError = error
      })

      inputData.forEach((dataChunk) => {
        inputStream.write(dataChunk)
      })
    })

    it("should not emit an error", () => {
      assert.strictEqual(actualError, null)
    })

    it("should emit each message in the order it was received", () => {
      assert.deepStrictEqual(actualMessageObjs, expectedMessageObjs)
    })
  })

  describe("when multiple message come in the same chunk", () => {
    const inputDataMessages = [
      `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`,
      `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"1","method":"test/test-method","params":{"b":"2"}}`,
      `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"2","method":"test/test-method","params":{"c":"3"}}`,
    ]
    const inputData = inputDataMessages.join("")

    const expectedMessageObjs = [
      { jsonrpc: "2.0", id: "0", method: "test/test-method", params: { a: "1" } },
      { jsonrpc: "2.0", id: "1", method: "test/test-method", params: { b: "2" } },
      { jsonrpc: "2.0", id: "2", method: "test/test-method", params: { c: "3" } },
    ]
    const actualMessageObjs = []
    let actualError = null

    beforeAll(() => {
      const inputStream = new PassThrough()
      const lspReader = new LspReader()
      inputStream.pipe(lspReader)
      lspReader.on("data", (message) => {
        actualMessageObjs.push(message)
      })
      lspReader.on("parse-error", (error) => {
        actualError = error
      })

      inputStream.write(inputData)
    })

    it("should not emit an error", () => {
      assert.strictEqual(actualError, null)
    })

    it("should emit each message in the order it was received", () => {
      assert.deepStrictEqual(actualMessageObjs, expectedMessageObjs)
    })
  })

  describe("when buffering partial messages in a multi message chunk", () => {
    describe("when the next message has an incomplete header", () => {
      const inputData = [
        `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"1","method":"test/test-method","params":{"b":"2"}}Content-Lengt`,
        `h: 73\r\n\r\n{"jsonrpc":"2.0","id":"2","method":"test/test-method","params":{"c":"3"}}`,
      ]

      const expectedMessageObjs = [
        { jsonrpc: "2.0", id: "0", method: "test/test-method", params: { a: "1" } },
        { jsonrpc: "2.0", id: "1", method: "test/test-method", params: { b: "2" } },
        { jsonrpc: "2.0", id: "2", method: "test/test-method", params: { c: "3" } },
      ]
      const actualMessageObjs = []
      let actualError = null

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on("data", (message) => {
          actualMessageObjs.push(message)
        })
        lspReader.on("parse-error", (error) => {
          actualError = error
        })

        inputData.forEach((dataChunk) => {
          inputStream.write(dataChunk)
        })
      })

      it("should not emit an error", () => {
        assert.strictEqual(actualError, null)
      })

      it("should emit each message in the order it was received", () => {
        assert.deepStrictEqual(actualMessageObjs, expectedMessageObjs)
      })
    })
  })
})
