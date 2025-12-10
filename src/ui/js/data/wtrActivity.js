import { exportDeps } from "../setup/dependencyManager.js"
import { EventEmitter } from "../setup/EventEmitter.js"

const wtrActivityEmitter = new EventEmitter()

/**
 * @param {WtrActivityMessage} activityMessage
 * @returns {void}
 */
export const emitActivity = (activityMessage) => {
  wtrActivityEmitter.emit("data", activityMessage)
}

exportDeps({ wtrActivityEmitter })
