import { exportDeps } from "../setup/dependencyManager.js" // make sure the global __WTR__ object is initilized with the exportDeps function
import { EventEmitter } from "../setup/EventEmitter.js"

const currentStatus = {
  isOnline: false,
  sessions: [],
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

export const setSessions = (sessions) => {
  currentStatus.sessions = sessions
  wtrStatusEmitter.emit("data", currentStatus)
}

exportDeps({ wtrStatusEmitter })
