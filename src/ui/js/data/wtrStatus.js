import { exportDeps } from "../setup/dependencyManager.js"
import { EventEmitter } from "../setup/EventEmitter.js"
import "../util/constants.js"

// how long to wait after disconnect before clearing client side data
const CLEAR_TIMEOUT_LENGTH_MS = 3000
const { maxSessionWedges } = __WTR__.constants

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

let clearDataTimeout
export const setIsOnline = (isOnline) => {
  if (isOnline === currentStatus.isOnline) {
    return
  }
  currentStatus.isOnline = isOnline

  if (!isOnline) {
    currentStatus.editors = currentStatus.editors.filter((s) => !s.isServer)
    clearDataTimeout = setTimeout(() => {
      setSessions([])
    }, CLEAR_TIMEOUT_LENGTH_MS)
  } else {
    clearTimeout(clearDataTimeout)
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
 * @param {EditorStatus[] | ClientStatus[]} sessions
 * @returns {EditorStatus[] | ClientStatus[]}
 */
const summarizeSessions = (sessions) => {
  if (sessions.length <= maxSessionWedges) {
    return sessions
  }
  const numOthers = sessions.length - maxSessionWedges + 1
  const truncatedList = []
  /** @type {EditorStatus & ClientStatus} */
  const otherSessions = {
    name: `${numOthers} others...`,
    openCount: 0,
    activeOpenCount: 0,
    watchCount: 0,
    activeWatchCount: 0,
    isServer: false,
    lsPid: null,
    editorPid: null,
  }
  for (let i = 0; i < maxSessionWedges - 1; i++) {
    truncatedList.push(sessions[i])
  }
  truncatedList.push(otherSessions)

  for (let i = maxSessionWedges - 1; i < sessions.length; i++) {
    const session = sessions[i]
    otherSessions.openCount += session.openCount
    otherSessions.activeOpenCount += session.activeOpenCount
    otherSessions.watchCount += session.watchCount
    otherSessions.activeWatchCount += session.activeWatchCount
    otherSessions.lsPid = otherSessions.lsPid || session.lsPid
    otherSessions.editorPid = otherSessions.editorPid || session.editorPid
    otherSessions.isServer = otherSessions.isServer || session.isServer
  }

  return truncatedList
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

  return { editors: summarizeSessions(editors), clients: summarizeSessions(clients) }
}

exportDeps({ wtrStatusEmitter })
