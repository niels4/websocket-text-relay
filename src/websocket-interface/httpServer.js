import { createServer } from 'node:http'
import path from 'node:path'
import fs from 'node:fs'
import * as url from 'node:url'
const parentDir = url.fileURLToPath(new URL('..', import.meta.url))

const uiDirName = "ui"
const uiDirPath = path.join(parentDir, uiDirName)

const allowedFileTypes = new Map([
  ["html", "text/html"],
  ["css", "text/css"],
  ["js", "application/javascript"],
  ["json", "application/json"],
  ["png", "image/png"],
  ["ttf", "font/ttf"],
])

const getFilePath = (url) => {
  url = url === "/" ? "./index.html" : "." + url
  return path.join(uiDirPath, url)
}

const getFileType = (fileUrl) => {
  const lastDotIndex = fileUrl.lastIndexOf(".")
  if (lastDotIndex < 0 || lastDotIndex >= fileUrl.length) { return "" }
  return fileUrl.substring(lastDotIndex + 1)
}

const requestHandler = (req, res) => {
  const filePath = getFilePath(req.url)
  const fileType = getFileType(filePath)
  const contentType = allowedFileTypes.get(fileType)
  if (!contentType) {
    res.writeHead(404)
    res.end("NOT FOUND!")
    return
  } 
  res.setHeader("Content-Type", contentType)
  res.writeHead(200)
  const fileStream = fs.createReadStream(filePath)
  fileStream.pipe(res)
}

export const createHttpServer = (port) => {
  return new Promise((resolve, reject) => {
    
    const server = createServer(requestHandler)

    server.on("error", (e) => {
      reject(e)
    })

    server.listen(port, () => {
      resolve(server)
    })
  })
}
