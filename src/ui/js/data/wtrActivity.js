import { exportDeps } from "../setup/dependencyManager.js"
import { EventEmitter } from "../setup/EventEmitter.js"

const dataWindowSize = 30
const dataWindowInterval = 1000

const dataWindow = initDataWindow()

const wtrActivityEmitter = new EventEmitter()

const wtrActivityDataWindowEmitter = new EventEmitter()
wtrActivityDataWindowEmitter.on = (event, handler) => {
  if (event === "data") {
    handler(dataWindow)
  }
  EventEmitter.prototype.on.call(wtrActivityDataWindowEmitter, event, handler)
}
wtrActivityDataWindowEmitter.addEventListener = wtrActivityDataWindowEmitter.on

/**
 * @param {WtrActivityMessage} activityMessage
 * @returns {void}
 */
export const emitActivity = (activityMessage) => {
  wtrActivityEmitter.emit("data", activityMessage)
}

let currentActivityCount = 0

const onTick = async () => {
  scheduleNextTick()
  const prevEndTime = dataWindow.at(-1).time
  const newTime = prevEndTime + dataWindowInterval
  dataWindow.shift()
  dataWindow.push({ time: newTime, value: currentActivityCount })
  currentActivityCount = 0
  wtrActivityDataWindowEmitter.emit("data", dataWindow)
}

function initDataWindow() {
  const now = new Date()
  now.setMilliseconds(0)
  const endTime = now.valueOf()
  return Array.from({ length: dataWindowSize }, (_, i) => ({
    time: endTime - (dataWindowSize - 1 - i) * dataWindowInterval,
    value: 0,
  }))
}

const scheduleNextTick = () => {
  const nowMillis = new Date().getMilliseconds()
  const millisUntilNextSecond = 1000 - nowMillis
  setTimeout(onTick, millisUntilNextSecond)
}

scheduleNextTick()

wtrActivityEmitter.on("data", () => {
  currentActivityCount++
})

exportDeps({ wtrActivityEmitter, wtrActivityDataWindowEmitter })
