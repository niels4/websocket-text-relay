import { PassThrough } from 'node:stream'
import { describe, it, expect, beforeAll } from "vitest"
import { LspReader } from './LspReader.js'
import { parseErrorCode, parseHeaderErrorMessage, parseJsonErrorMessage } from './constants.js'

describe("LspReader", () => {
  describe("simple case", () => {
    describe("when a message comes through the input stream", () => {
      const inputData = `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`
      const expectedMessageObj = {"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}
      let actualMessageObj

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on('data', (message) => {
          actualMessageObj = message
        })
        inputStream.write(inputData)
      })

      it("should parse the incoming data and emit the json rpc message object", () => {
        expect(actualMessageObj).to.deep.equal(expectedMessageObj)
      })
    })

    describe("when content-length header isn't capitalized", () => {
      const inputData = `content-length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`
      const expectedMessageObj = {"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}
      let actualMessageObj

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on('data', (message) => {
          actualMessageObj = message
        })
        inputStream.write(inputData)
      })

      it("should parse the incoming data and emit the json rpc message object", () => {
        expect(actualMessageObj).to.deep.equal(expectedMessageObj)
      })
    })
  })

  describe("error cases", () => {
    describe("when Content-Length header is missing", () => {
      const inputData = `Bad-Header: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`
      const expectedError = {code: parseErrorCode, message: parseHeaderErrorMessage}
      let actualMessageObj = null
      let actualError

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on('data', (message) => {
          actualMessageObj = message
        })
        lspReader.on('parse-error', (error) => {
          actualError = error
        })
        inputStream.write(inputData)
      })

      it("should emit an 'parse-error' event with the parse header error message", () => {
        expect(actualError).to.deep.equal(expectedError)
      })

      it("should not emit any objects", () => {
        expect(actualMessageObj).toBeNull()
      })
    })

    describe("when recovering from a bad header error", () => {
      const inputData = [
        `Bad-Header: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`,
        `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"1","method":"test/test-method","params":{"b":"2"}}`
      ]
      const expectedError = {code: parseErrorCode, message: parseHeaderErrorMessage}
      const expectedObject = {"jsonrpc":"2.0","id":"1","method":"test/test-method","params":{"b":"2"}}
      let actualMessageObjs = []
      let actualErrors = []

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on('data', (message) => {
          actualMessageObjs.push(message)
        })
        lspReader.on('parse-error', (error) => {
          actualErrors.push(error)
        })
        inputData.forEach((data) => {
          inputStream.write(data)
        })
      })

      it("should emit only 1 'parse-error' event with the parse header error message", () => {
        expect(actualErrors.length).toEqual(1)
        expect(actualErrors[0]).to.deep.equal(expectedError)
      })

      it("should not emit one object from the message with the valid header", () => {
        expect(actualMessageObjs.length).toEqual(1)
        expect(actualMessageObjs[0]).to.deep.equal(expectedObject)
      })
    })

    describe("when recovering from an invalid JSON error", () => {
      const inputData = [
        `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}>`,
        `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"1","method":"test/test-method","params":{"b":"2"}}`
      ]
      const expectedError = {code: parseErrorCode, message: parseJsonErrorMessage}
      const expectedObject = {"jsonrpc":"2.0","id":"1","method":"test/test-method","params":{"b":"2"}}
      let actualMessageObjs = []
      let actualErrors = []

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on('data', (message) => {
          actualMessageObjs.push(message)
        })
        lspReader.on('parse-error', (error) => {
          actualErrors.push(error)
        })
        inputData.forEach((data) => {
          inputStream.write(data)
        })
      })

      it("should emit only 1 'parse-error' event with the parse header error message", () => {
        expect(actualErrors.length).toEqual(1)
        expect(actualErrors[0]).to.deep.equal(expectedError)
      })

      it("should not emit one object from the message with the valid header", () => {
        expect(actualMessageObjs.length).toEqual(1)
        expect(actualMessageObjs[0]).to.deep.equal(expectedObject)
      })
    })

    describe("when JSON is invalid", () => {
      const inputData = `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}>`
      const expectedError = {code: parseErrorCode, message: parseJsonErrorMessage}
      let actualMessageObj = null
      let actualError

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on('data', (message) => {
          actualMessageObj = message
        })
        lspReader.on('parse-error', (error) => {
          actualError = error
        })
        inputStream.write(inputData)
      })

      it("should emit an 'parse-error' event with the parse JSON error message", () => {
        expect(actualError).to.deep.equal(expectedError)
      })

      it("should not emit any objects", () => {
        expect(actualMessageObj).toBeNull()
      })
    })
  })

  describe("single message buffering cases", () => {
    describe("when the message is split in the middle of the header", () => {
      const inputData = [`Content-Len`, `gth: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`]
      const expectedMessageObj = {"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}
      let actualMessageObj
      let actualError = null

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on('data', (message) => {
          actualMessageObj = message
        })
        lspReader.on('parse-error', (error) => {
          actualError = error
        })

        inputData.forEach((dataChunk) => {
          inputStream.write(dataChunk)
        })
      })

      it("should not emit an error", () => {
        expect(actualError).toBeNull()
      })

      it("should buffer the data until it can parse the incoming data and emit the json rpc message object", () => {
        expect(actualMessageObj).to.deep.equal(expectedMessageObj)
      })
    })

    describe("when the message is split in the middle of the header many times", () => {
      const inputData = [`Cont`, `ent-L`, `en`, `gth`, `: 7`, `3\r`, `\n`, `\r\n`, `{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`]
      const expectedMessageObj = {"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}
      let actualMessageObj
      let actualError = null

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on('data', (message) => {
          actualMessageObj = message
        })
        lspReader.on('parse-error', (error) => {
          actualError = error
        })

        inputData.forEach((dataChunk) => {
          inputStream.write(dataChunk)
        })
      })

      it("should not emit an error", () => {
        expect(actualError).toBeNull()
      })

      it("should buffer the data until it can parse the incoming data and emit the json rpc message object", () => {
        expect(actualMessageObj).to.deep.equal(expectedMessageObj)
      })
    })

    describe("when the message is split in the middle of the JSON", () => {
      const inputData = [`Content-Length: 73\r\n\r\n{"jsonrpc":"2.0",`, `"id":"0","method":"test/test-method","params":{"a":"1"}}`]
      const expectedMessageObj = {"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}
      let actualMessageObj
      let actualError = null

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on('data', (message) => {
          actualMessageObj = message
        })
        lspReader.on('parse-error', (error) => {
          actualError = error
        })

        inputData.forEach((dataChunk) => {
          inputStream.write(dataChunk)
        })
      })

      it("should not emit an error", () => {
        expect(actualError).toBeNull()
      })

      it("should buffer the data until it can parse the incoming data and emit the json rpc message object", () => {
        expect(actualMessageObj).to.deep.equal(expectedMessageObj)
      })
    })

    describe("when the message is split in the middle of the header and JSON many times", () => {
      const inputData = [`Con`, `tent-Len`, `gth: 73\r`, `\n`, `\r\n`, `{`, `"jso`, `nrpc":"2.0"`, `,"id":"0","method":"te`, `st/test-method","params":{"a":`, `"1"}`, `}`]
      const expectedMessageObj = {"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}
      let actualMessageObj
      let actualError = null

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on('data', (message) => {
          actualMessageObj = message
        })
        lspReader.on('parse-error', (error) => {
          actualError = error
        })

        inputData.forEach((dataChunk) => {
          inputStream.write(dataChunk)
        })
      })

      it("should not emit an error", () => {
        expect(actualError).toBeNull()
      })

      it("should buffer the data until it can parse the incoming data and emit the json rpc message object", () => {
        expect(actualMessageObj).to.deep.equal(expectedMessageObj)
      })
    })
  })

  describe("when the buffer needs resizing", () => {
    describe("when a message larger than the buffer size comes through the input stream", () => {
      const inputData = `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`
      const expectedMessageObj = {"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}
      let lspReader
      let actualMessageObj
      let actualInitialBufferSize

      beforeAll(() => {
        const inputStream = new PassThrough()
        lspReader = new LspReader({initialBufferSize: 10})
        actualInitialBufferSize = lspReader.buffer.length
        inputStream.pipe(lspReader)
        lspReader.on('data', (message) => {
          actualMessageObj = message
        })
        inputStream.write(inputData)
      })

      it("should construct the lspReader with the passed in initialBufferSize", () => {
        expect(actualInitialBufferSize).toEqual(10)
      })

      it("should need to trigger a resize", () => {
        expect(inputData.length).toBeGreaterThan(actualInitialBufferSize)
      })

      it("should increase the buffer to a size larger than the message chunk", () => {
        expect(lspReader.buffer.length).toBeGreaterThan(inputData.length)
      })

      it("should parse the incoming data and emit the json rpc message object", () => {
        expect(actualMessageObj).to.deep.equal(expectedMessageObj)
      })
    })

    describe("when a buffer that already has data needs resizing", () => {
      const inputData = [`Content-Len`, `gth: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`]
      const expectedMessageObj = {"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}
      let actualMessageObj
      let lspReader
      let actualInitialBufferSize
      let actualError = null

      beforeAll(() => {
        const inputStream = new PassThrough()
        lspReader = new LspReader({initialBufferSize: 70})
        actualInitialBufferSize = lspReader.buffer.length
        inputStream.pipe(lspReader)
        lspReader.on('data', (message) => {
          actualMessageObj = message
        })
        lspReader.on('parse-error', (error) => {
          actualError = error
        })

        inputData.forEach((dataChunk) => {
          inputStream.write(dataChunk)
        })
      })

      it("should not emit an error", () => {
        expect(actualError).toBeNull()
      })

      it("should construct the lspReader with the passed in initialBufferSize", () => {
        expect(actualInitialBufferSize).toEqual(70)
      })

      it("should need to trigger a resize after the first buffered message", () => {
        expect(inputData[0].length).toBeLessThan(actualInitialBufferSize)
        expect(inputData[1].length).toBeGreaterThan(actualInitialBufferSize)
      })

      it("should increase the buffer to a size larger than the combined message chunks", () => {
        expect(lspReader.buffer.length).toBeGreaterThan(inputData[0].length + inputData[1].length)
      })

      it("should buffer the data until it can parse the incoming data and emit the json rpc message object", () => {
        expect(actualMessageObj).to.deep.equal(expectedMessageObj)
      })
    })
  })

  describe("when multiple message come in separate chunks", () => {
    const inputData = [
      `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`,
      `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"1","method":"test/test-method","params":{"b":"2"}}`,
      `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"2","method":"test/test-method","params":{"c":"3"}}`
    ]

    const expectedMessageObjs = [
      {"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}},
      {"jsonrpc":"2.0","id":"1","method":"test/test-method","params":{"b":"2"}},
      {"jsonrpc":"2.0","id":"2","method":"test/test-method","params":{"c":"3"}}
    ]
    let actualMessageObjs = []
    let actualError = null

    beforeAll(() => {
      const inputStream = new PassThrough()
      const lspReader = new LspReader()
      inputStream.pipe(lspReader)
      lspReader.on('data', (message) => {
        actualMessageObjs.push(message)
      })
      lspReader.on('parse-error', (error) => {
        actualError = error
      })

      inputData.forEach((dataChunk) => {
        inputStream.write(dataChunk)
      })
    })

    it("should not emit an error", () => {
      expect(actualError).toBeNull()
    })

    it("should emit each message in the order it was received", () => {
      expect(actualMessageObjs).to.deep.equal(expectedMessageObjs)
    })
  })

  describe("when multiple message come in the same chunk", () => {
    const inputDataMessages = [
      `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}`,
      `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"1","method":"test/test-method","params":{"b":"2"}}`,
      `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"2","method":"test/test-method","params":{"c":"3"}}`
    ]
    const inputData = inputDataMessages.join("")

    const expectedMessageObjs = [
      {"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}},
      {"jsonrpc":"2.0","id":"1","method":"test/test-method","params":{"b":"2"}},
      {"jsonrpc":"2.0","id":"2","method":"test/test-method","params":{"c":"3"}}
    ]
    let actualMessageObjs = []
    let actualError = null

    beforeAll(() => {
      const inputStream = new PassThrough()
      const lspReader = new LspReader()
      inputStream.pipe(lspReader)
      lspReader.on('data', (message) => {
        actualMessageObjs.push(message)
      })
      lspReader.on('parse-error', (error) => {
        actualError = error
      })

      inputStream.write(inputData)
    })

    it("should not emit an error", () => {
      expect(actualError).toBeNull()
    })

    it("should emit each message in the order it was received", () => {
      expect(actualMessageObjs).to.deep.equal(expectedMessageObjs)
    })
  })

  describe("when buffering partial messages in a multi message chunk", () => {
    describe("when the next message has an incomplete header", () => {
      const inputData = [
        `Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}}Content-Length: 73\r\n\r\n{"jsonrpc":"2.0","id":"1","method":"test/test-method","params":{"b":"2"}}Content-Lengt`,
        `h: 73\r\n\r\n{"jsonrpc":"2.0","id":"2","method":"test/test-method","params":{"c":"3"}}`
      ]

      const expectedMessageObjs = [
        {"jsonrpc":"2.0","id":"0","method":"test/test-method","params":{"a":"1"}},
        {"jsonrpc":"2.0","id":"1","method":"test/test-method","params":{"b":"2"}},
        {"jsonrpc":"2.0","id":"2","method":"test/test-method","params":{"c":"3"}}
      ]
      let actualMessageObjs = []
      let actualError = null

      beforeAll(() => {
        const inputStream = new PassThrough()
        const lspReader = new LspReader()
        inputStream.pipe(lspReader)
        lspReader.on('data', (message) => {
          actualMessageObjs.push(message)
        })
        lspReader.on('parse-error', (error) => {
          actualError = error
        })

        inputData.forEach((dataChunk) => {
          inputStream.write(dataChunk)
        })
      })

      it("should not emit an error", () => {
        expect(actualError).toBeNull()
      })

      it("should emit each message in the order it was received", () => {
        expect(actualMessageObjs).to.deep.equal(expectedMessageObjs)
      })
    })
  })
})
