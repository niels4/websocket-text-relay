import { Transform } from "node:stream"
import { headerKey, parseErrorCode, parseHeaderErrorMessage, parseJsonErrorMessage } from "./constants.js"

const defaultInitialBufferSize = 10000

const jsonStartCharCode = "{".charCodeAt(0)

// as long as there are no '{' characters in the header section, this function will work. (LSP Clients should not be putting any { chars in the header anyhow)
const findJsonStartIndex = (data, bufferStartIndex, bufferEndIndex) => {
  const bufferedData = data.subarray(bufferStartIndex, bufferEndIndex)
  const index = bufferedData.indexOf(jsonStartCharCode)
  if (index < 0) {
    return index
  }
  return index + bufferStartIndex
}

const frameStartRegex = new RegExp(`${headerKey}: ([0-9]+)`, "i")

const getJsonLength = (data, bufferStartIndex, jsonStartIndex) => {
  const startStr = data.subarray(bufferStartIndex, jsonStartIndex).toString()
  const match = frameStartRegex.exec(startStr)
  if (!match) {
    return null
  }
  return Number.parseInt(match[1])
}

export class LspReader extends Transform {
  constructor(options = {}) {
    super({ readableObjectMode: true })
    this.buffer = Buffer.alloc(options.initialBufferSize || defaultInitialBufferSize)
    this._resetBuffer()
  }

  _transform(data, _enc, next) {
    this._writeToBuffer(data)
    this._handleBufferedData()
    next()
  }

  _resetBuffer() {
    this.bufferStartIndex = 0
    this.bufferIndex = 0
    this.jsonStartIndex = -1
    this.jsonEndIndex = -1
    this.jsonLength = null
  }

  _resetBufferWithRemainingData() {
    const remainingData = this.buffer.subarray(this.bufferStartIndex, this.bufferIndex)
    this._resetBuffer()
    this._writeToBuffer(remainingData)
  }

  _advanceBufferOneMessage() {
    this.bufferStartIndex = this.jsonEndIndex
    this.jsonStartIndex = -1
    this.jsonEndIndex = -1
    this.jsonLength = null
  }

  _writeToBuffer(data) {
    const spaceLeft = this.buffer.length - this.bufferIndex
    if (data.length > spaceLeft) {
      const newBufferSize = (this.bufferIndex + data.length) * 1.3 // add a padding of 30% to reduce the number of resizes
      const newBuffer = Buffer.alloc(newBufferSize, this.buffer)
      this.buffer = newBuffer
    }
    data.copy(this.buffer, this.bufferIndex)
    this.bufferIndex += data.length
  }

  _foundJsonLength() {
    if (this.jsonStartIndex < 0) {
      this.jsonStartIndex = findJsonStartIndex(this.buffer, this.bufferStartIndex, this.bufferIndex)
      if (this.jsonStartIndex < 0) {
        return false
      }

      this.jsonLength = getJsonLength(this.buffer, this.bufferStartIndex, this.jsonStartIndex)

      if (this.jsonLength === null) {
        this.emit("parse-error", { code: parseErrorCode, message: parseHeaderErrorMessage })
        this._resetBuffer()
        return false
      }

      this.jsonEndIndex = this.jsonStartIndex + this.jsonLength
    }

    return true
  }

  _handleBufferedData() {
    // loop as long as we have messages to parse in the buffer (ignore the eslint warning about the constant true value)
    while (true) {
      if (!this._foundJsonLength()) {
        break
      } // we don't have a header to read yet, keep buffering
      if (this.jsonEndIndex > this.bufferIndex) {
        break
      } // we have a header but not the complete json message, keep buffering

      const messageStr = this.buffer.subarray(this.jsonStartIndex, this.jsonEndIndex).toString()

      let messageObj
      try {
        messageObj = JSON.parse(messageStr)
      } catch {
        this.emit("parse-error", { code: parseErrorCode, message: parseJsonErrorMessage })
        this._resetBuffer()
        return
      }

      this.push(messageObj)
      this._advanceBufferOneMessage()
    }

    if (this.bufferStartIndex === this.bufferIndex) {
      // we have read all messages in the buffer, reset everything back to empty state
      this._resetBuffer()
    } else if (this.bufferStartIndex > 0) {
      // we have a partial message at the end of this buffer, reset the buffer to contain only this data
      this._resetBufferWithRemainingData()
    }
    // if the bufferStartIndex is still 0, then there is nothing to reset, just keep buffering until we have a complete message
  }
}
