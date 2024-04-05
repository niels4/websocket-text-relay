import { headerKey } from './constants.js'

const jsonrpc = "2.0"

// exported for testing purposes
export const createHeader = (messageStr) => {
  const byteLength = Buffer.byteLength(messageStr)
  return `${headerKey}: ${byteLength}\r\n\r\n`
}

// exported for testing purposes
export const writeToOutput = (outputStream, messageObj) => {
  const outputStr = JSON.stringify(messageObj)
  const header = createHeader(outputStr)
  outputStream.write(header)
  outputStream.write(outputStr)
}

export const writeResponse = (outputStream, id, error, result) => {
  const response = {jsonrpc, id}
  if (error) {
    response.error = error
  } else {
    response.result = result
  }
  writeToOutput(outputStream, response)
}

export const writeNotification = (outputStream, method, params) => {
  const message = {jsonrpc, method, params}
  writeToOutput(outputStream, message)
}

let requestId = 0
const nextRequestId = () => String(requestId++)
// only to be used for testing!
export const TESTONLY_resetRequestId = () => requestId = 0

export const writeRequest = (outputStream, method, params) => {
  const id = nextRequestId()
  const request = {jsonrpc, id, method, params}
  writeToOutput(outputStream, request)
  return id
}
