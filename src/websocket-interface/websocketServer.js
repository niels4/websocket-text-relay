import { WebSocketServer } from 'ws'
import { createHttpServer } from "./httpServer.js"
import { apiMethods } from "./websocketApi.js"
import { WtrSession } from './WtrSession.js'
import { isValidOrigin } from './util.js'

export const createWebsocketServer = async (port) => {
  const httpServer = await createHttpServer(port) // promise will reject if can't start HTTP server on specified port

  const websocketServer = new WebSocketServer({ server: httpServer })
  
  websocketServer.on('error', () =>  { })

  websocketServer.on('connection', (wsConnection, request) => {
    if (!isValidOrigin(request)) {
      wsConnection.close()
      return
    }
    new WtrSession({apiMethods, wsConnection})
  })

  return websocketServer
}
