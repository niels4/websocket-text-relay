import { EventEmitter } from './EventEmitter.js'

const dependencies = {}
window.__WTR__ = dependencies

const exportDeps = (exportObj) => Object.assign(dependencies, exportObj)

const statusDataEmitter = new EventEmitter()

const cleanupFuncs = []

const onEvent = (emitter, event, func) => {
  if (typeof emitter.on === 'function') {
    emitter.on(event, func)
    cleanupFuncs.push(() => emitter.removeListener(event, func))
  } else if (typeof emitter.addEventListener === 'function') {
    emitter.addEventListener(event, func)
    cleanupFuncs.push(() => emitter.removeEventListener(event, func))
  } else {
    throw new Error("target is not an event emitter")
  }
}

const cleanupEventHandlers = () => {
  cleanupFuncs.forEach(f => f())
  cleanupFuncs.length = 0
}

exportDeps({exportDeps, statusDataEmitter, onEvent, cleanupEventHandlers})

export default dependencies
