import { createServer } from "node:http"
import path from "node:path"
import { createReadStream } from "node:fs"
import fs from "node:fs/promises"
import * as url from "node:url"
import { isValidOrigin } from "./util.js"
const parentDir = url.fileURLToPath(new URL("..", import.meta.url))

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
  if (lastDotIndex < 0 || lastDotIndex >= fileUrl.length) {
    return ""
  }
  return fileUrl.substring(lastDotIndex + 1)
}

const requestHandler = (allowedHosts) => (req, res) => {
  if (!isValidOrigin(allowedHosts, req)) {
    res.writeHead(403)
    res.end("FORBIDDEN!")
    return
  }
  const filePath = getFilePath(req.url)
  const fileType = getFileType(filePath)
  const contentType = allowedFileTypes.get(fileType)
  if (!contentType) {
    res.writeHead(404)
    res.end("NOT FOUND!")
    return
  }

  fs.access(filePath, fs.constants.R_OK)
    .then(() => {
      res.setHeader("Content-Type", contentType)
      res.writeHead(200)
      const fileStream = createReadStream(filePath)
      fileStream.pipe(res)
    })
    .catch(() => {
      res.writeHead(404)
      res.end("NOT FOUND!")
    })
}

export const createHttpServer = ({ port, allowedHosts, allowNetworkAccess }) => {
  return new Promise((resolve, reject) => {
    const server = createServer(requestHandler(allowedHosts))

    server.on("error", (e) => {
      reject(e)
    })

    const listenAddress = allowNetworkAccess ? "0.0.0.0" : "127.0.0.1"

    server.listen(port, listenAddress, () => {
      resolve(server)
    })
  })
}
