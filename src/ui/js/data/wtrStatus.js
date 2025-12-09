import "../util/dependencyManager.js" // make sure the global __WTR__ object is initilized with the exportDeps function
import { EventEmitter } from "../util/EventEmitter.js"
const { exportDeps } = window.__WTR__

const currentStatus = {
  isOnline: false,
  sessions: [],
}

const wtrStatusEmitter = new EventEmitter()
wtrStatusEmitter.on = function (name, handler) {
  EventEmitter.prototype.on.call(wtrStatusEmitter, name, handler)
  // automatically push the data to the event handler the first time its called
  if (name === "data") {
    handler(currentStatus)
  }
}
wtrStatusEmitter.addEventListener = wtrStatusEmitter.on

export const setIsOnline = (isOnline) => {
  currentStatus.isOnline = isOnline
  wtrStatusEmitter.emit("data", currentStatus)
}

export const setSessions = (sessions) => {
  currentStatus.sessions = sessions
  wtrStatusEmitter.emit("data", currentStatus)
}

exportDeps({ wtrStatusEmitter })
