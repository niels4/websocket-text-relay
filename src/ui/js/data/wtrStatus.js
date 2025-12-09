import { exportDeps } from "../setup/dependencyManager.js" // make sure the global __WTR__ object is initilized with the exportDeps function
import { EventEmitter } from "../setup/EventEmitter.js"

/** @type {WtrStatus} */
const currentStatus = {
  isOnline: false,
  editors: [],
  clients: [],
}

const wtrStatusEmitter = new EventEmitter()
wtrStatusEmitter.on = function (event, handler) {
  EventEmitter.prototype.on.call(wtrStatusEmitter, event, handler)
  // automatically push the data to the event handler when it initially subscribes
  if (event === "data") {
    handler(currentStatus)
  }
}
wtrStatusEmitter.addEventListener = wtrStatusEmitter.on

export const setIsOnline = (isOnline) => {
  if (isOnline === currentStatus.isOnline) {
    return
  }
  currentStatus.isOnline = isOnline

  if (!isOnline) {
    currentStatus.sessions = currentStatus.sessions.filter((s) => !s.isServer)
  }

  wtrStatusEmitter.emit("data", currentStatus)
}

/**
 * @param {SessionStatus[]} sessions
 * @returns {void}
 */
export const setSessions = (sessions) => {
  const { editors, clients } = sessionDataTranform(sessions)
  currentStatus.editors = editors
  currentStatus.clients = clients
  wtrStatusEmitter.emit("data", currentStatus)
}

/**
 * @param {SessionStatus[]} sessions
 * @returns {editors: EditorStatus[], clients: ClientStatus[]}
 */
const sessionDataTranform = (sessions) => {
  const editors = []
  const clients = []
  const allSessions = new Map()

  sessions.forEach((session) => {
    allSessions.set(session.id, session)
    session.activeWatchCount = 0
    session.activeOpenCount = 0
    const isEditor = session.editorPid != null || session.lsPid != null
    if (isEditor) {
      editors.push(session)
    } else {
      clients.push(session)
    }
  })

  for (const session of allSessions.values()) {
    const openFileLinks = Object.values(session.openFileLinks)
    session.activeOpenCount = openFileLinks.length
    openFileLinks.forEach((links) => {
      links.forEach(({ clientId }) => {
        const clientSession = allSessions.get(clientId)
        if (!clientSession) {
          return
        }
        clientSession.activeWatchCount++
      })
    })
  }

  return { editors, clients }
}

exportDeps({ wtrStatusEmitter })
