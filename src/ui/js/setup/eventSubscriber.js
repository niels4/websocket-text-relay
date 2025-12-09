const allCleanupFunctions = new Map()

export const eventSubscriber = (key) => {
  const previousCleanupFunctions = allCleanupFunctions.get(key)
  previousCleanupFunctions?.forEach((f) => f())

  const cleanupFunctions = []
  allCleanupFunctions.set(key, cleanupFunctions)

  return function onEvent(emitter, event, handler) {
    if (typeof emitter.on === "function") {
      cleanupFunctions.push(() => emitter.removeListener(event, handler))
      emitter.on(event, handler)
    } else if (typeof emitter.addEventListener === "function") {
      cleanupFunctions.push(() => emitter.removeEventListener(event, handler))
      emitter.addEventListener(event, handler)
    } else {
      throw new Error("target is not an event emitter")
    }
  }
}
